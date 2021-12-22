import NodePath from "path-extender";
import * as fs from "../../patch";
import * as util from "../util";
import { ensureDirSync } from "./dir";
import { Type } from "@n3okill/utils";

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
 * the ability to pass in `relative to current working directory` paths.
 * @internal
 */
/* istanbul ignore next: not tested in windows without Admin perms */
export function symlinkPathsSync(srcPath: fs.PathLike, dstPath: fs.PathLike): util.EnsureSymlinkPathsType {
    if (NodePath.isAbsolute(srcPath)) {
        fs.lstatSync(srcPath);
        return { toCwd: srcPath, toDst: srcPath };
    } else {
        const dstDir = NodePath.dirname(dstPath);
        const relativeToDst = NodePath.join(dstDir, srcPath);
        try {
            fs.lstatSync(relativeToDst);
            return { toCwd: relativeToDst, toDst: srcPath };
        } catch (err) {
            fs.lstatSync(srcPath);
            return {
                toCwd: srcPath,
                toDst: NodePath.relative(dstDir, srcPath),
            };
        }
    }
}

/** @internal */
/* istanbul ignore next: not tested in windows without Admin perms */
function symlinkType(srcPath: fs.PathLike, options: util._EnsureOptionsSymlinkInternal): util.EnsureOptionsSymlinkType {
    if (options.type) {
        return options.type;
    }
    try {
        const stat = fs.lstatSync(srcPath);
        return stat.isDirectory() ? "dir" : "file";
    } catch (err) {
        return "file";
    }
}

/**
 * ensureSymlink - ensures symlink existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureSymlinkSync(src, dst);
 * console.log(`Symlink is ensured in the file system.`);
 * ```
 *
 * @param srcPath - the source path of the symlink
 * @param dstPath - the destination path to the symlink
 * @param options  - used to create the symlink or modify it, options can be
 * - `type` - the type of the symlink
 * @return `dstPath: fs.PathLike`
 */
/* istanbul ignore next: not tested in windows without Admin perms */
export function ensureSymlinkSync(
    srcPath: fs.PathLike,
    dstPath: fs.PathLike,
    options?: util.EnsureOptionsSymlink
): fs.PathLike {
    if (Type.isString(options)) {
        options = { type: options as util.EnsureOptionsSymlinkType };
    }
    const opt = util.getSymlinkOptions(options) as util._EnsureOptionsSymlinkInternal;

    try {
        fs.lstatSync(dstPath);
    } catch (err) {
        const relative = symlinkPathsSync(srcPath, dstPath);
        srcPath = relative.toDst;
        opt.type = symlinkType(relative.toCwd, opt);
        ensureDirSync(NodePath.dirname(dstPath));
        fs.symlinkSync(srcPath, dstPath, opt.type);
    }
    return dstPath;
}
