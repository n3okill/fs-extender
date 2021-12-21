import * as fs from "../patch";
import NodePath from "path-extender";
import { Type, BufferUtil } from "@n3okill/utils";
import * as util from "./util";
import { FindFilterType, FindResultType, findSync } from "../find";
import { mkdirpSync } from "../mkdirp";
import { toStringOrBuffer, equal, replace } from "../util";

/** @internal */
type _PathLike = string | Buffer;

/**
 * Copy items in the file system async
 *
 * ```js
 * import * as fs from "fs-extender";
 *
 * const statistics = fs.copySync(file1, dstFile1);
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
 * @return `copy.CopyStats` -  Copied items statistics
 */
export function copySync(
    src: Buffer,
    dst: fs.PathLike,
    options?: util.CopyOptions<Buffer> | FindFilterType<Buffer>
): util.CopyStats;
export function copySync(
    src: fs.PathLike,
    dst: Buffer,
    options?: util.CopyOptions<Buffer> | FindFilterType<Buffer>
): util.CopyStats;
export function copySync(
    src: string | URL,
    dst: string | URL,
    options?: util.CopyOptions<string> | FindFilterType<string>
): util.CopyStats;
export function copySync(
    src: fs.PathLike,
    dst: fs.PathLike,
    options?: util.CopyOptions<string | Buffer> | FindFilterType<string | Buffer>
): util.CopyStats;
export function copySync(src: fs.PathLike, dst: fs.PathLike, options?: unknown): util.CopyStats {
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

/** @internal */
type TGetStats = [statSrc: fs.Stats | fs.BigIntStats, statDest: fs.Stats | fs.BigIntStats];

/** @internal */
function _copy(options: util._CopyOptionsInternal): util.CopyStats {
    const stats = checkPathsSync(options.src, options.dst, options);
    checkParentPathsSync(options.src, stats[0], options.dst, options);
    const dstParent = NodePath.dirname(options.dst);
    mkdirpSync(dstParent);
    return loadItemsSync(options);
}

/** @internal */
function checkPathsSync(src: _PathLike, dst: _PathLike, options: util._CopyOptionsInternal): TGetStats {
    const stats = getStatsSync(src, dst, options);

    if (stats?.[1]) {
        if (areIdentical(stats[0], stats[1])) {
            const e = createError("EINVAL", "Source and destination must not be the same.");
            throw e;
        }
        if (stats[0].isDirectory() && !stats[1].isDirectory()) {
            const e = createError("EISDIR", `Cannot overwrite directory ${src} with non-directory ${dst}`);
            throw e;
        }
        /* istanbul ignore next */
        if (!stats[0].isDirectory() && stats[1].isDirectory()) {
            const e = createError("ENOTDIR", `Cannot overwrite non-directory ${src} with directory ${dst}`);
            throw e;
        }
    }
    if (stats?.[0].isDirectory() && isSrcSubdir(src, dst)) {
        const e = createError("EINVAL", `Cannot copy '${src}' to a subdirectory of self '${dst}'`);
        throw e;
    }
    return stats;
}

// Recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
/** @internal */
function checkParentPathsSync(
    src: _PathLike,
    srcStat: fs.Stats | fs.BigIntStats,
    dst: _PathLike,
    options: util._CopyOptionsInternal
): void {
    const srcParent = NodePath.resolve(NodePath.dirname(src));
    const dstParent = NodePath.resolve(NodePath.dirname(dst));
    if (equal(dstParent, srcParent) || equal(dstParent, NodePath.parse(dstParent).root)) {
        return;
    }
    try {
        const dstStat = fs.statSync(dstParent);
        /* istanbul ignore next */
        if (areIdentical(srcStat, dstStat)) {
            const e = createError("EINVAL", `Cannot copy '${src}' to a subdirectory of self '${dst}'`);
            throw e;
        }
        return checkParentPathsSync(src, srcStat, dstParent, options);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        /* istanbul ignore next */
        throw err;
    }
}

/** @internal */
function getStatsSync(src: _PathLike, dst: _PathLike, options: util._CopyOptionsInternal): TGetStats {
    const statFn = options.dereference ? fs.statSync : fs.lstatSync;
    const statSrc = statFn(src);
    try {
        const statDst = statFn(dst);
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
function isSrcSubdir(src: string | Buffer, dst: string | Buffer) {
    const srcArr = Buffer.isBuffer(src)
        ? BufferUtil.split(NodePath.resolve(src), NodePath.sep)
        : NodePath.resolve(src).split(NodePath.sep);
    const dstArr = Buffer.isBuffer(dst)
        ? BufferUtil.split(NodePath.resolve(dst), NodePath.sep)
        : NodePath.resolve(dst).split(NodePath.sep);
    return (srcArr as Array<string | Buffer>).reduce((acc, cur, i) => acc && equal(dstArr[i], cur), true);
}

/** @internal */
function createError(code: string, message: string): Error {
    const error: NodeJS.ErrnoException = new Error(message);
    error.code = code;
    return error;
}

/** @internal */
function loadItemsSync(options: util._CopyOptionsInternal): util.CopyStats {
    const items = findSync(options.src, {
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
    return copyItemSync(options);
}

/** @internal */
function onErrorSync(err: NodeJS.ErrnoException, options: util._CopyOptionsInternal): void {
    options.statistics.errors++;
    /* istanbul ignore next */
    if (!options.stopOnError) {
        if (Type.isArray(options.errors)) {
            (options.errors as NodeJS.ErrnoException[]).push(err);
        } else {
            (options.errors as fs.WriteStream).write(err.stack + "\n");
        }
    }
}

/** @internal */
function copyOnErrorSync(err: NodeJS.ErrnoException, options: util._CopyOptionsInternal): util.CopyStats {
    onErrorSync(err, options);
    if (options.stopOnError) {
        throw err;
    }
    /* istanbul ignore next */
    return copyItemSync(options);
}

/** @internal */
function copyItemSync(options: util._CopyOptionsInternal): util.CopyStats {
    const item = options.itemsToCopy?.shift();
    if (item) {
        switch (util.getItemType(item.stats)) {
            case util.ItemType.dir:
                if (options.ignoreEmptyFolders) {
                    /* istanbul ignore next */
                    if (options.itemsToCopy?.some((s) => s.path.indexOf(item.path as never) === 0)) {
                        return copyItemSync(options);
                    }
                }
                return onDirSync(item, options);
            case util.ItemType.blockDevice:
            case util.ItemType.characterDevice:
            case util.ItemType.file:
                return onFileSync(item, options);
            case util.ItemType.symbolikLink:
                return onLinkSync(item, options);
            case util.ItemType.fifo:
            case util.ItemType.socket:
            case util.ItemType.unknown:
                /* istanbul ignore next */
                const e = createError(
                    "EINVAL",
                    `cannot copy an ${util.getItemTypeName(util.getItemType(item.stats))} file type: ${item.path}`
                );
                return copyOnErrorSync(e, options);
        }
    } else {
        /* istanbul ignore next */
        if (options.stream) {
            options.stream.push(null);
        }
        return options.statistics;
    }
}

/** @internal */
function onDirSync(item: FindResultType<string | Buffer>, options: util._CopyOptionsInternal): util.CopyStats {
    const target = replace(item.path, options.src, options.dst);
    try {
        mkdirpSync(target, { mode: item.stats.mode });
        options.statistics.copied.directories++;
        fs.chmodSync(target, item.stats.mode);
        return copyItemSync(options);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
}

/** @internal */
function onFileSync(item: FindResultType<string | Buffer>, options: util._CopyOptionsInternal): util.CopyStats {
    const target = replace(item.path, options.src, options.dst);
    try {
        mkdirpSync(NodePath.dirname(target));
        const writable = isWritableSync(target, options);
        if (writable) {
            return copyFileSync(item, target, options);
        } else {
            if ((options.overwrite || options.overwriteNewer) && equal(item.path, target)) {
                /* istanbul ignore next */
                if (options.overwriteNewer) {
                    const stat = fs.statSync(target);
                    if (item.stats.mtimeMs > stat.mtimeMs) {
                        rmFileSync(target, options);
                        return copyFileSync(item, target, options);
                    } else {
                        if (options.errorOnExist) {
                            return copyOnErrorSync(createError("EEXIST", `${target} already exists`), options);
                        } else {
                            return copyItemSync(options);
                        }
                    }
                } else {
                    rmFileSync(target, options);
                    return copyFileSync(item, target, options);
                }
            } else {
                if (options.errorOnExist) {
                    return copyOnErrorSync(createError("EEXIST", `${target} already exists`), options);
                } else {
                    /* istanbul ignore next */
                    return copyItemSync(options);
                }
            }
        }
    } catch (err) {
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
}

/** @internal */
/* istanbul ignore next */
function rmFileSync(target: _PathLike, options: util._CopyOptionsInternal): void {
    fs.unlinkSync(target);
    options.statistics.overwrited++;
}

/** @internal */
function isWritableSync(path: _PathLike, options: util._CopyOptionsInternal): boolean {
    const stat = options.dereference ? fs.statSync : fs.lstatSync;
    try {
        stat(path);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return true;
        }
    }
    return false;
}

/** @internal */
function copyFileSync(
    item: FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): util.CopyStats {
    const buff = Buffer.alloc(options.BUFFER_LENGTH);
    let bytesRead, pos;
    const fdr = fs.openSync(item.path, "r");
    const fdw = fs.openSync(target, "w", item.stats.mode);
    bytesRead = 1;
    pos = 0;
    while (bytesRead > 0) {
        bytesRead = fs.readSync(fdr, buff, 0, options.BUFFER_LENGTH, pos);
        fs.writeSync(fdw, buff, 0, bytesRead);
        pos += bytesRead;
    }

    fs.chmodSync(target, item.stats.mode);
    fs.closeSync(fdr);
    fs.closeSync(fdw);

    return afterCopyFileSync(item, target, options);
}

/** @internal */
function afterCopyFileSync(
    item: FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): util.CopyStats {
    options.statistics.copied.files++;
    options.statistics.copied.size += item.stats.size;
    if (options.preserveTimestamps) {
        return handleTimestampAndModeSync(item, target, options);
    }
    try {
        setFileModeSync(target, item.stats.mode);
    } catch (err) {
        /* istanbul ignore next */
        copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
    return copyItemSync(options);
}

/** @internal */
function handleTimestampAndModeSync(
    item: FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): util.CopyStats {
    // Make sure the file is writable before setting the timestamp
    // otherwise open fails with EPERM when invoked with 'r+'
    // (through utimes call)
    /* istanbul ignore next */
    if ((item.stats.mode & 0o200) === 0) {
        try {
            makeFileWritableSync(target, item.stats.mode);
        } catch (err) {
            return copyOnErrorSync(err as NodeJS.ErrnoException, options);
        }
    }
    return setTimestampAndModeSync(item, target, options);
}

/** @internal */
function makeFileWritableSync(target: _PathLike, mode: number) {
    /* istanbul ignore next */
    setFileModeSync(target, mode | 0o200);
}

/** @internal */
function setTimestampAndModeSync(
    item: FindResultType<string | Buffer>,
    target: _PathLike,
    options: util._CopyOptionsInternal
): util.CopyStats {
    // The initial srcStat.atime cannot be trusted
    // because it is modified by the read(2) system call
    // (See https://nodejs.org/api/fs.html#fs_stat_time_values)
    try {
        const stat = options.dereference ? fs.statSync(item.path) : fs.lstatSync(item.path);
        util.utimesMillisSync(target, stat.atime, item.stats.mtime);
        setFileModeSync(target, item.stats.mode);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
    return copyItemSync(options);
}

/** @internal */
function setFileModeSync(target: _PathLike, mode: fs.Mode) {
    fs.chmodSync(target, mode);
}

/** @internal */
function onLinkSync(item: FindResultType<string | Buffer>, options: util._CopyOptionsInternal): util.CopyStats {
    const target = replace(item.path, options.src, options.dst);
    let resolvedPath;
    try {
        resolvedPath = fs.readlinkSync(item.path);
    } catch (err) {
        /* istanbul ignore next */
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
    return checkLinkSync(resolvedPath, target, item, options);
}

/** @internal */
function checkLinkSync(
    resolvedPath: _PathLike,
    target: _PathLike,
    item: FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): util.CopyStats {
    /* istanbul ignore next */
    if (options.dereference) {
        resolvedPath = NodePath.resolve(process.cwd(), resolvedPath);
    }
    if (equal(resolvedPath, target)) {
        return copyItemSync(options);
    }
    const writable = isWritableSync(target, options);
    if (writable) {
        return makeLinkSync(resolvedPath, target, item, options);
    }
    let targetDst;
    /* istanbul ignore next */
    try {
        targetDst = fs.readlinkSync(target);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "EINVAL") {
            return copyItemSync(options);
        }
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
    /* istanbul ignore next */
    if (options.dereference) {
        targetDst = NodePath.resolve(process.cwd(), targetDst);
    }
    /* istanbul ignore next */
    if (equal(targetDst, resolvedPath)) {
        return copyItemSync(options);
    }
    /* istanbul ignore next */
    rmFileSync(target, options);
    /* istanbul ignore next */
    return makeLinkSync(resolvedPath, target, item, options);
}

/** @internal */
function makeLinkSync(
    resolvedPath: _PathLike,
    target: _PathLike,
    item: FindResultType<string | Buffer>,
    options: util._CopyOptionsInternal
): util.CopyStats {
    try {
        fs.symlinkSync(resolvedPath, target);
        options.statistics.copied.links++;
    } catch (err) {
        /* istanbul ignore next */
        return copyOnErrorSync(err as NodeJS.ErrnoException, options);
    }
    return copyItemSync(options);
}
