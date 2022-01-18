import NodePath from "path-extender";
import * as fs from "../../patch";
import * as util from "../util";
import * as dir from "./dir";

/** @internal */
/* istanbul ignore next: not tested in windows without Admin perms */
async function symlinkType(
    srcPath: fs.PathLike,
    options: util._EnsureOptionsSymlinkInternal
): Promise<util.EnsureOptionsSymlinkType> {
    if (options.type) {
        return options.type;
    }
    try {
        const stat = await fs.promises.lstat(srcPath);
        return stat.isDirectory() ? "dir" : "file";
    } catch (err) {
        return "file";
    }
}

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 * @internal
 */
/* istanbul ignore next: not tested in windows without Admin perms */
async function symlinkPaths(srcPath: fs.PathLike, dstPath: fs.PathLike): Promise<util.EnsureSymlinkPathsType> {
    if (NodePath.isAbsolute(srcPath)) {
        try {
            await fs.promises.lstat(srcPath);
        } catch (err) {
            (err as NodeJS.ErrnoException).message = (err as NodeJS.ErrnoException).message.replace(
                "lstat",
                "ensureSymlink"
            );
            throw err;
        }
        return { toCwd: srcPath, toDst: srcPath };
    } else {
        const dstDir = NodePath.dirname(dstPath);
        const relativeToDst = NodePath.join(dstDir, srcPath);
        try {
            await fs.promises.lstat(relativeToDst);
            return { toCwd: relativeToDst, toDst: srcPath };
        } catch (err) {
            try {
                await fs.promises.lstat(srcPath);
            } catch (err2) {
                (err2 as NodeJS.ErrnoException).message = (err2 as NodeJS.ErrnoException).message.replace(
                    "lstat",
                    "ensureSymlink"
                );
                throw err2;
            }
            return {
                toCwd: srcPath,
                toDst: NodePath.relative(dstDir, srcPath),
            };
        }
    }
}

/** @internal */
/* istanbul ignore next: not tested in windows without Admin perms */
async function _ensureSymlink(
    srcPath: fs.PathLike,
    dstPath: fs.PathLike,
    options: util._EnsureOptionsSymlinkInternal
): Promise<fs.PathLike> {
    try {
        await fs.promises.lstat(dstPath);
    } catch (err) {
        const relative = await symlinkPaths(srcPath, dstPath);
        srcPath = relative.toDst;
        options.type = await symlinkType(relative.toCwd, options);
        await dir.promises.ensureDir(NodePath.dirname(dstPath));
        await fs.promises.symlink(srcPath, dstPath, options.type);
    }
    return dstPath;
}

/**
 * ensureSymlink - ensures symlink existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureSymlink(src, dst,(err)=>{
 *  if(!err) {
 *      console.log(`Symlink is ensured in the file system.`);
 *  }
 * });
 * ```
 *
 * @param srcPath - the source path of the symlink
 * @param dstPath - the destination path to the symlink
 * @param options  - used to create the symlink or modify it, options can be
 * - `type` - the type of the symlink
 * @param callback - `(err: Error | null, dstPath: fs.PathLike)`
 */
export function ensureSymlink(
    srcPath: fs.PathLike,
    dstPath: fs.PathLike,
    options: util.EnsureOptionsSymlink,
    callback: (err: NodeJS.ErrnoException, dstPath?: fs.PathLike) => void
): void;
export function ensureSymlink(
    srcPath: fs.PathLike,
    dstPath: fs.PathLike,
    callback: (err: NodeJS.ErrnoException, dstPath?: fs.PathLike) => void
): void;
/* istanbul ignore next: not tested in windows without Admin perms */
export function ensureSymlink(srcPath: fs.PathLike, dstPath: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = util.getSymlinkOptions(options) as util._EnsureOptionsSymlinkInternal;
    const cb = util.getCallback(options, callback);
    _ensureSymlink(srcPath, dstPath, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * ensureSymlink - ensures symlink existence on file system
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.ensureSymlink(src, dst);
     * console.log(`Symlink is ensured in the file system.`);
     * ```
     *
     * @param srcPath - the source path of the symlink
     * @param dstPath - the destination path to the symlink
     * @param options  - used to create the symlink or modify it, options can be
     * - `type` - the type of the symlink
     * @return `Promise<dstPath: fs.PathLike>`
     */
    /* istanbul ignore next: not tested in windows without Admin perms */
    export async function ensureSymlink(
        srcPath: fs.PathLike,
        dstPath: fs.PathLike,
        options?: util.EnsureOptionsSymlink
    ): Promise<fs.PathLike> {
        const opt = util.getSymlinkOptions(options) as util._EnsureOptionsSymlinkInternal;
        return _ensureSymlink(srcPath, dstPath, opt);
    }
}
