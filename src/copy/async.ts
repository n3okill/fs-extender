import * as fs from "../patch";
import NodePath from "path-extender";
import { Type, BufferUtil } from "@n3okill/utils";
import * as util from "./util";
import * as find from "../find";
import * as mkdirp from "../mkdirp";
import { toStringOrBuffer, equal, replace } from "../util";

/** @internal */
type _PathLike = string | Buffer;

/**
 * Copy items in the file system async
 *
 * ```js
 * import * as fs from "fs-extender";
 *
 * fs.copy(file1, dstFile1,(err, statistics)=>{
 *  if(!err) {
 *      console.log("File copied with success");
 *  }
 * });
 * ```
 *
 * @param src - the path to be copied
 * @param dst - the destination path for the items
 * @param options - options
 * - `overwrite` - Overwrite destination items if they already exist, default to `false`
 * - `overwriteNewer` - Overwrite destination items only if items being copied are newer, default is `false`
 * - `stopOnError` - Stop when an error is encountered, default is `true`
 * - `dereference` - Dereference link, default is `false`
 * - `errors` - Options about what to do with occurring errors, if null will be temporarily saved in an `array`
 *               otherwise will be written to a `stream` defined by the user, default to `null`
 *               and will only be used if `stopOnError` is `false`
 *               options - `null | CopyOptionsErrorStream | Array<NodeJS.ErrnoException>`
 * - `errorOnExist` - return an error if file to be copied already exists when overwrite and overwriteNewer is `false` (default `true`)
 * - `filter` - `function` or `RegExp` used to narrow results
 *              this function receives an object of type `{path: fs.PathLike, stat: fs.Stats}`
 * - `BUFFER_LENGTH` - Size of the buffer to be used when copying files, default is `(64 * 1024)`
 * - `preserveTimestamps` - When `true`, will set last modification and access times to the ones of the original source files.
 *                          When `false`, timestamp behavior is OS-dependent. Default is `false`.
 * - `depth` - the final depth to copy items, default is `-1`, will copy everything
 * - `stream` - if a `stream` is passed then it's possible to check the copy process with
 *              ```js
 *                  stream.on("data",(chunk:string)=>{
 *                      const obj:StreamOutType = JSON.parse(chunk);
 *                  });
 *              ```
 *              Note: this doesn't work with `copySync`
 * - `ignoreEmptyFolders` - If `true` will ignore the copy of empty folder's default `false`
 * @param callback - the callback function that will be called after the copy is done
 * @return {Error|Object} Error | Copied items statistics
 */
export function copy(
    src: Buffer,
    dst: fs.PathLike,
    options: util.CopyOptions<Buffer> | find.FindFilterTypeAsync<Buffer> | undefined,
    callback: (err: NodeJS.ErrnoException | null, statistics: util.CopyStats) => void
): void;
export function copy(
    src: fs.PathLike,
    dst: Buffer,
    options: util.CopyOptions<Buffer> | find.FindFilterTypeAsync<Buffer> | undefined,
    callback: (err: NodeJS.ErrnoException | null, statistics: util.CopyStats) => void
): void;
export function copy(
    src: string | URL,
    dst: string | URL,
    options: util.CopyOptions<string> | find.FindFilterTypeAsync<string> | undefined,
    callback: (err: NodeJS.ErrnoException | null, statistics: util.CopyStats) => void
): void;
export function copy(
    src: fs.PathLike,
    dst: fs.PathLike,
    options: util.CopyOptions<string | Buffer> | find.FindFilterTypeAsync<string | Buffer> | undefined,
    callback: (err: NodeJS.ErrnoException | null, statistics: util.CopyStats) => void
): void;
export function copy(
    src: fs.PathLike,
    dst: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, statistics: util.CopyStats) => void
): void;
export function copy(src: fs.PathLike, dst: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = util.getOptions(options, callback);
    const cb = util.getCallback(options, callback);
    const isBuffer = Buffer.isBuffer(src) || Buffer.isBuffer(dst);
    opt.src = toStringOrBuffer(isBuffer, src);
    opt.dst = toStringOrBuffer(isBuffer, dst);

    // Warn about using preserveTimestamps on 32-bit node
    /* istanbul ignore next */
    if (opt.preserveTimestamps === true && process.arch === "ia32") {
        const warning = "Using the preserveTimestamps option in 32-bit " + "node is not recommended";
        process.emitWarning(warning, "TimestampPrecisionWarning");
    }
    _copy(opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/** @internal */
type TGetStats = [statSrc: fs.Stats | fs.BigIntStats, statDest: fs.Stats | fs.BigIntStats];

/** @internal */
async function _copy(options: util._CopyOptionsInternal): Promise<util.CopyStats> {
    const stats = await checkPaths(options.src, options.dst, options);
    await checkParentPaths(options.src, stats[0] as fs.BigIntStats, options.dst, options);
    const dstParent = NodePath.dirname(options.dst);
    await mkdirp.promises.mkdirp(dstParent);
    return loadItems(options);
}

/** @internal */
/* istanbul ignore next */
async function checkPaths(src: _PathLike, dst: _PathLike, options: util._CopyOptionsInternal): Promise<TGetStats> {
    const stats = await getStats(src, dst, options);

    if (stats[1]) {
        if (areIdentical(stats[0], stats[1])) {
            const e = createError("EINVAL", "Source and destination must not be the same.");
            throw e;
        }
        if (stats[0].isDirectory() && !stats[1].isDirectory()) {
            const e = createError(
                "EISDIR",
                `Cannot overwrite directory ${src.toString()} with non-directory ${dst.toString()}`
            );
            throw e;
        }
        /* istanbul ignore next */
        if (!stats[0].isDirectory() && stats[1].isDirectory()) {
            const e = createError(
                "ENOTDIR",
                `Cannot overwrite non-directory ${src.toString()} with directory ${dst.toString()}`
            );
            throw e;
        }
    }
    if (stats[0].isDirectory() && isSrcSubdir(src, dst)) {
        const e = createError(
            "EINVAL",
            `Cannot copy '${src.toString()}' to a subdirectory of self '${dst.toString()}'`
        );
        throw e;
    }
    return stats;
}

// Recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
/** @internal */
/* istanbul ignore next */
async function checkParentPaths(
    src: _PathLike,
    srcStat: fs.Stats | fs.BigIntStats,
    dst: _PathLike,
    options: util._CopyOptionsInternal
): Promise<void> {
    const srcParent = NodePath.resolve(NodePath.dirname(src));
    const dstParent = NodePath.resolve(NodePath.dirname(dst));
    if (equal(dstParent, srcParent) || equal(dstParent, NodePath.parse(dstParent).root)) {
        return;
    }
    try {
        const dstStat = await fs.promises.stat(dstParent);
        if (areIdentical(srcStat, dstStat)) {
            const e = createError("EINVAL", `Cannot copy '${src}' to a subdirectory of self '${dst}'`);
            throw e;
        }
        return checkParentPaths(src, srcStat, dstParent, options);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        throw err;
    }
}

/** @internal */
/* istanbul ignore next */
async function getStats(src: _PathLike, dst: _PathLike, options: util._CopyOptionsInternal): Promise<TGetStats> {
    const statFn = options.dereference ? fs.promises.stat : fs.promises.lstat;
    const statSrc = await statFn(src);
    try {
        const statDst = await statFn(dst);
        return [statSrc, statDst];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return [statSrc, undefined as never];
        }
        /* istanbul ignore next */
        throw err;
    }
}

/** @internal */
function areIdentical(srcStat: fs.Stats | fs.BigIntStats, dstStat: fs.Stats | fs.BigIntStats): boolean {
    return (
        dstStat.ino !== undefined &&
        dstStat.dev !== undefined &&
        dstStat.ino === srcStat.ino &&
        dstStat.dev === srcStat.dev
    );
}

// return true if dest is a subdir of src, otherwise false.
// It only checks the path strings.
/** @internal */
function isSrcSubdir(src: _PathLike, dst: _PathLike) {
    const srcArr = Buffer.isBuffer(src)
        ? BufferUtil.split(NodePath.resolve(src), NodePath.sep)
        : NodePath.resolve(src).split(NodePath.sep);
    const dstArr = Buffer.isBuffer(dst)
        ? BufferUtil.split(NodePath.resolve(dst), NodePath.sep)
        : NodePath.resolve(dst).split(NodePath.sep);
    return (srcArr as Array<_PathLike>).reduce((acc, cur, i) => acc && equal(dstArr[i], cur), true);
}

/** @internal */
function createError(code: string, message: string): Error {
    const error: NodeJS.ErrnoException = new Error(message);
    error.code = code;
    return error;
}

/** @internal */
/* istanbul ignore next */
function writeToStream(
    options: util._CopyOptionsInternal,
    item: find.FindResultType<string | Buffer>,
    err?: NodeJS.ErrnoException
): void {
    if (options.stream) {
        const itemsCopied =
            options.statistics.copied.directories + options.statistics.copied.files + options.statistics.copied.links;
        const sizeCopied = options.statistics.copied.size;
        const sizeToCopy = options.statistics.size - sizeCopied;
        const now = new Date();
        const untilNow = now.getTime() - options.startTime.getTime();
        const sun = untilNow / (sizeCopied || 1);
        const eta = sizeToCopy * sun;
        const obj: util.CopyStreamOutType = {
            totalItems: options.statistics.items,
            itemsCopied: itemsCopied,
            type: util.getItemTypeName(util.getItemType(item.stats)),
            item: Buffer.isBuffer(item.path) ? BufferUtil.toString(item.path) : item.path,
            size: item.stats.size,
            eta: eta,
            timeTaken: untilNow,
        };
        /* istanbul ignore next */
        if (err) {
            obj.error = err;
        }
        options.stream.push(JSON.stringify(obj));
    }
}

/** @internal */
async function loadItems(options: util._CopyOptionsInternal): Promise<util.CopyStats> {
    const items = await find.promises.find(options.src, {
        filter: options.filter,
        dereference: options.dereference,
    });
    if (items.length === 0) {
        return options.statistics;
    }

    //remove items that don't have a parent dir, this can happen when the dir is filtered out
    if (items[0].stats.isDirectory()) {
        const dirs = items.filter((i) => i.stats.isDirectory()).map((s) => s.path);
        const newItems = items.filter(
            (i) =>
                i.stats.isDirectory() ||
                (!i.stats.isDirectory() && dirs.some((s) => equal(s, NodePath.dirname(i.path))))
        );
        options.itemsToCopy = newItems;
    } else {
        options.itemsToCopy = items;
    }

    options.statistics.items = items.length;
    options.statistics.size = items
        .map((item): number =>
            item.stats.isFile() || item.stats.isBlockDevice() || item.stats.isCharacterDevice() ? item.stats.size : 0
        )
        .reduce((acc, val): number => acc + val, 0);
    return copyItem(options);
}

/** @internal */
/* istanbul ignore next */
async function onError(err: NodeJS.ErrnoException, options: util._CopyOptionsInternal): Promise<void> {
    options.statistics.errors++;
    /* istanbul ignore next */
    if (!options.stopOnError) {
        if (Type.isArray(options.errors)) {
            (options.errors as NodeJS.ErrnoException[]).push(err);
            return;
        } else {
            return new Promise((resolve, reject) => {
                (options.errors as fs.WriteStream).write(err.stack + "\n", (err?: NodeJS.ErrnoException | null) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
    }
}

/** @internal */
/* istanbul ignore next */
async function copyOnError(
    err: NodeJS.ErrnoException,
    options: util._CopyOptionsInternal,
    item: find.FindResultType<string | Buffer>
): Promise<util.CopyStats> {
    await onError(err, options);
    writeToStream(options, item, err);
    if (options.stopOnError) {
        throw err;
    }
    /* istanbul ignore next */
    return copyItem(options);
}

/** @internal */
/* istanbul ignore next */
async function copyItem(options: util._CopyOptionsInternal): Promise<util.CopyStats> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const item = options.itemsToCopy!.shift();
    if (item) {
        switch (util.getItemType(item.stats)) {
            case util.ItemType.dir:
                if (options.ignoreEmptyFolders) {
                    /* istanbul ignore next */
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    if (options.itemsToCopy!.some((s) => s.path.indexOf(item.path as never) === 0)) {
                        return copyItem(options);
                    }
                }
                writeToStream(options, item);
                return onDir(item, options);
            case util.ItemType.blockDevice:
            case util.ItemType.characterDevice:
            case util.ItemType.file:
                writeToStream(options, item);
                return onFile(item, options);
            case util.ItemType.symbolikLink:
                writeToStream(options, item);
                return onLink(item, options);
            case util.ItemType.fifo:
            case util.ItemType.socket:
            case util.ItemType.unknown:
                /* istanbul ignore next */
                const e = createError(
                    "EINVAL",
                    `cannot copy an ${util.getItemTypeName(util.getItemType(item.stats))} file type: ${item.path}`
                );
                return copyOnError(e, options, item);
        }
    } else {
        if (options.stream) {
            options.stream.push(null);
        }
        return options.statistics;
    }
}

/** @internal */
async function onDir(
    item: find.FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    const target = replace(item.path, options.src, options.dst);
    try {
        await mkdirp.promises.mkdirp(target, { mode: item.stats.mode });
        await fs.promises.chmod(target, item.stats.mode);
        options.statistics.copied.directories++;
        return copyItem(options);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
}

/** @internal */
/* istanbul ignore next */
async function onFile(
    item: find.FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    const target = replace(item.path, options.src, options.dst);
    try {
        await mkdirp.promises.mkdirp(NodePath.dirname(target));
        const writable = await isWritable(target, options);
        if (writable) {
            return copyFile(item, target, options);
        } else {
            if ((options.overwrite || options.overwriteNewer) && !equal(item.path, target)) {
                /* istanbul ignore next */
                if (options.overwriteNewer) {
                    const stat = await fs.promises.stat(target);
                    if (item.stats.mtimeMs > stat.mtimeMs) {
                        await rmFile(target, options);
                        return copyFile(item, target, options);
                    } else {
                        if (options.errorOnExist) {
                            return copyOnError(createError("EEXIST", `${target} already exists`), options, item);
                        } else {
                            return copyItem(options);
                        }
                    }
                } else {
                    await rmFile(target, options);
                    return copyFile(item, target, options);
                }
            } else {
                if (options.errorOnExist) {
                    return copyOnError(createError("EEXIST", `${target} already exists`), options, item);
                } else {
                    return copyItem(options);
                }
            }
        }
    } catch (err) {
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
}

/** @internal */
/* istanbul ignore next */
async function rmFile(target: _PathLike, options: util._CopyOptionsInternal): Promise<void> {
    await fs.promises.unlink(target);
    options.statistics.overwrited++;
}

/** @internal */
/* istanbul ignore next */
async function isWritable(path: _PathLike, options: util._CopyOptionsInternal): Promise<boolean> {
    const stat = options.dereference ? fs.promises.stat : fs.promises.lstat;
    try {
        await stat(path);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return true;
        }
    }
    return false;
}

/** @internal */
async function copyFile(
    item: find.FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    await new Promise<void>((resolve, reject) => {
        const reader = fs.createReadStream(item.path);
        const writer = fs.createWriteStream(target, { mode: item.stats.mode });
        reader.on("error", (err) => reject(err));
        writer.on("error", (err) => reject(err));
        writer.on("finish", () => resolve());
        reader.pipe(writer);
    });
    return afterCopyFile(item, target, options);
}

/** @internal */
async function afterCopyFile(
    item: find.FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    options.statistics.copied.files++;
    options.statistics.copied.size += item.stats.size;
    if (options.preserveTimestamps) {
        return handleTimestampAndMode(item, target, options);
    }
    try {
        await setFileMode(target, item.stats.mode);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
    return copyItem(options);
}

/** @internal */
async function handleTimestampAndMode(
    item: find.FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    // Make sure the file is writable before setting the timestamp
    // otherwise open fails with EPERM when invoked with 'r+'
    // (through utimes call)
    /* istanbul ignore next */
    if ((item.stats.mode & 0o200) === 0) {
        try {
            await makeFileWritable(target, item.stats.mode);
        } catch (err) {
            return copyOnError(err as NodeJS.ErrnoException, options, item);
        }
    }
    return setTimestampAndMode(item, target, options);
}

/** @internal */
async function makeFileWritable(target: _PathLike, mode: number) {
    /* istanbul ignore next */
    return setFileMode(target, mode | 0o200);
}

/** @internal */
async function setTimestampAndMode(
    item: find.FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    // The initial srcStat.atime cannot be trusted
    // because it is modified by the read(2) system call
    // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
    try {
        const stat = options.dereference ? await fs.promises.stat(item.path) : await fs.promises.lstat(item.path);
        await util.utimesMillis(target, stat.atime, item.stats.mtime);
        await setFileMode(target, item.stats.mode);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
    return copyItem(options);
}

/** @internal */
async function setFileMode(target: _PathLike, mode: fs.Mode) {
    return fs.promises.chmod(target, mode);
}

/** @internal */
/* istanbul ignore next */
async function onLink(
    item: find.FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    const target = replace(item.path, options.src, options.dst);
    let resolvedPath;
    try {
        resolvedPath = await fs.promises.readlink(item.path);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
    return checkLink(resolvedPath, target, item, options);
}

/** @internal */
/* istanbul ignore next */
async function checkLink(
    resolvedPath: _PathLike,
    target: _PathLike,
    item: find.FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    /* istanbul ignore next */
    if (options.dereference) {
        resolvedPath = NodePath.resolve(process.cwd(), resolvedPath);
    }
    if (equal(resolvedPath, target)) {
        return copyItem(options);
    }
    const writable = await isWritable(target, options);
    if (writable) {
        return makeLink(resolvedPath, target, item, options);
    }
    let targetDst;
    /* istanbul ignore next */
    try {
        targetDst = await fs.promises.readlink(target);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "EINVAL") {
            return copyItem(options);
        }
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
    /* istanbul ignore next */
    if (options.dereference) {
        targetDst = NodePath.resolve(process.cwd(), targetDst);
    }
    /* istanbul ignore next */
    if (equal(targetDst, resolvedPath)) {
        return copyItem(options);
    }
    await rmFile(target, options);
    return makeLink(resolvedPath, target, item, options);
}

/** @internal */
/* istanbul ignore next */
async function makeLink(
    resolvedPath: _PathLike,
    target: _PathLike,
    item: find.FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): Promise<util.CopyStats> {
    try {
        await fs.promises.symlink(resolvedPath, target);
        options.statistics.copied.links++;
        /* istanbul ignore next */
    } catch (err) {
        return copyOnError(err as NodeJS.ErrnoException, options, item);
    }
    return copyItem(options);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Copy items in the file system async
     *
     * ```js
     * import * as fs from "fs-extender";
     *
     * const statistics = await fs.promises.copy(file1, dstFile1);
     * console.log("File copied with success");
     * ```
     *
     * @param src - the path to be copied
     * @param dst - the destination path for the items
     * @param options - options
     * - `overwrite` - Overwrite destination items if they already exist, default to `false`
     * - `overwriteNewer` - Overwrite destination items only if items being copied are newer, default is `false`
     * - `stopOnError` - Stop when an error is encountered, default is `true`
     * - `dereference` - Dereference link, default is `false`
     * - `errors` - Options about what to do with occurring errors, if null will be temporarily saved in an `array`
     *               otherwise will be written to a `stream` defined by the user, default to `null`
     *               and will only be used if `stopOnError` is `false`
     *               options - `null | CopyOptionsErrorStream | Array<NodeJS.ErrnoException>`
     * - `errorOnExist` - return an error if file to be copied already exists when overwrite and overwriteNewer is `false` (default `true`)
     * - `filter` - `function` or `RegExp` used to narrow results
     *              this function receives an object of type `{path: fs.PathLike, stat: fs.Stats}`
     * - `BUFFER_LENGTH` - Size of the buffer to be used when copying files, default is `(64 * 1024)`
     * - `preserveTimestamps` - When `true`, will set last modification and access times to the ones of the original source files.
     *                          When `false`, timestamp behavior is OS-dependent. Default is `false`.
     * - `depth` - the final depth to copy items, default is `-1`, will copy everything
     * - `stream` - if a `stream` is passed then it's possible to check the copy process with
     *              ```js
     *                  stream.on("data",(chunk:string)=>{
     *                      const obj:StreamOutType = JSON.parse(chunk);
     *                  });
     *              ```
     *              Note: this doesn't work with `copySync`
     * - `ignoreEmptyFolders` - If `true` will ignore the copy of empty folder's default `false`
     * @return Promise<copy.CopyStats> Copied items statistics
     */
    export async function copy(
        src: Buffer,
        dst: fs.PathLike,
        options?: util.CopyOptions<Buffer> | find.FindFilterTypeAsync<Buffer>
    ): Promise<util.CopyStats>;
    export async function copy(
        src: fs.PathLike,
        dst: Buffer,
        options?: util.CopyOptions<Buffer> | find.FindFilterTypeAsync<Buffer>
    ): Promise<util.CopyStats>;
    export async function copy(
        src: string | URL,
        dst: string | URL,
        options?: util.CopyOptions<string> | find.FindFilterTypeAsync<string>
    ): Promise<util.CopyStats>;
    export async function copy(
        src: fs.PathLike,
        dst: fs.PathLike,
        options?: util.CopyOptions<string | Buffer> | find.FindFilterTypeAsync<string | Buffer>
    ): Promise<util.CopyStats>;
    export async function copy(src: fs.PathLike, dst: fs.PathLike, options?: unknown): Promise<util.CopyStats> {
        const opt = util.getOptions(options, true);
        // Warn about using preserveTimestamps on 32-bit node
        /* istanbul ignore next */
        if (opt.preserveTimestamps === true && process.arch === "ia32") {
            const warning = "Using the preserveTimestamps option in 32-bit " + "node is not recommended";
            process.emitWarning(warning, "TimestampPrecisionWarning");
        }
        const isBuffer = Buffer.isBuffer(src) || Buffer.isBuffer(dst);
        opt.src = toStringOrBuffer(isBuffer, src);
        opt.dst = toStringOrBuffer(isBuffer, dst);
        return _copy(opt);
    }
}
