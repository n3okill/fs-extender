import NodePath from "path-extender";
import * as fs from "../patch";
import * as mkdirp from "../mkdirp";
import * as rm from "../rm";
import * as copy from "../copy";
import * as util from "../util";
import { platform } from "os";
import { Readable } from "stream";
import * as NodeFs from "fs";
import { BufferUtil } from "@n3okill/utils";

/** @internal */
const IsWindows = /^win/.test(platform());

/** @internal */
type _PathLike = string | Buffer;

export type MoveStreamOutType = {
    operation: string;
    type: string;
    item: string;
    error?: NodeJS.ErrnoException;
};

/** Options for enfsmove */
export type MoveOptions = {
    /** Overwrite existing destination items, default to false */
    overwrite?: boolean;

    /** Overwrite only if source file is newer than destination file default `false`
     * this works by checking the last time the files have been modified `stat.mTime`
     */
    overwriteNewer?: boolean;
    /**
     * This option allows to bypass the `renameSync` function in patch, because it can
     * stop the event loop in `win32` if the file can't be renamed for some reason
     */
    bypassRename?: boolean;
    /** if a stream is passed then it's possible to check the move process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * this doesn't work with `moveSync`
     */
    stream?: Readable;
    /** Merge items at destination default `false`
     * If overwrite `true` will overwrite items at destination
     * otherwise triggers an error when a file already exists
     */
    merge?: boolean;
};

/** @internal */
type MoveOptionsInternal = Required<Omit<MoveOptions, "stream">> & {
    stream?: Readable;
    streamCopy?: Readable;
    streamRm?: Readable;
};

/** @internal */
function getOptions(opt: unknown): MoveOptionsInternal {
    return {
        overwrite: util.getObjectOption(opt, "overwrite", false),
        bypassRename: util.getObjectOption(opt, "bypassRename", false),
        stream: util.getObjectOption(opt, "stream", undefined),
        merge: util.getObjectOption(opt, "merge", false),
        overwriteNewer: util.getObjectOption(opt, "overwriteNewer", false),
    };
}

/** @internal */
function writeToStream(
    options: MoveOptionsInternal,
    path: _PathLike,
    stats: fs.Stats,
    err?: NodeJS.ErrnoException
): void {
    if (options.stream) {
        const obj: MoveStreamOutType = {
            operation: "move",
            type: util.getItemTypeName(util.getItemType(stats)),
            item: Buffer.isBuffer(path) ? BufferUtil.toString(path) : path,
        };
        if (err) {
            obj.error = err;
        }
        options.stream.push(JSON.stringify(obj));
    }
}

/**
 * Move items in the file system async
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.move(srcPath, dstPath,(err)=>{
 *  if(!err) {
 *      console.log("Files moved with success");
 *  }
 * });
 * ```
 *
 * @param src - the path to the items being moved
 * @param dst - the destination path to where the items will be moved
 * @param options - options
 * - `overwrite` - Overwrite existing destination items, default to false
 * - `overwriteNewer` - Overwrite only if source file is newer than destination file default `false`
 * this works by checking the last time the files have been modified `stat.mTime`
 * - `bypassRename` - This option allows to bypass the `renameSync` function in patch, because it can
 * stop the event loop in `win32` if the file can't be renamed for some reason
 *  - `stream` - if a stream is passed then it's possible to check the move process with
 * ```js
 * stream.on("data",(chunk:string)=>{
 *    const obj:StreamOutType = JSON.parse(chunk);
 * });
 * ```
 * Note: this doesn't work with `moveSync`
 * - `merge` - Merge items at destination default `false`
 * If overwrite `true` will overwrite items at destination
 * otherwise triggers an error when a file already exists
 * @param callback - the callback function that will be called after the list is done
 */
export function move(
    src: fs.PathLike,
    dst: fs.PathLike,
    options: MoveOptions | undefined,
    callback: (err: NodeJS.ErrnoException) => void
): void;
export function move(src: fs.PathLike, dst: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void;
export function move(src: fs.PathLike, dst: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = getOptions(options);
    const cb = util.getCallback(options, callback);
    _move(src, dst, opt)
        .then(() => cb(null))
        .catch((err) => cb(err));
}

/** @internal */
function createStreams(options: MoveOptionsInternal): void {
    if (options.stream) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const streamCopy = new Readable({ read() {} });
        streamCopy.on("data", (chunk: Buffer) => {
            const obj: copy.CopyStreamOutType = JSON.parse(chunk.toString());
            const r: MoveStreamOutType = {
                operation: "copy",
                item: Buffer.isBuffer(obj.item) ? BufferUtil.toString(obj.item) : obj.item,
                type: obj.type,
            };
            /* istanbul ignore next */
            if ("error" in obj) {
                r.error = obj.error;
            }

            options.stream?.push(JSON.stringify(r));
        });
        options.streamCopy = streamCopy;
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const streamRm = new Readable({ read() {} });
        streamRm.on("data", (chunk: Buffer) => {
            const obj: rm.RmStreamOutType = JSON.parse(chunk.toString());
            const r: MoveStreamOutType = {
                operation: "rm",
                item: Buffer.isBuffer(obj.item) ? BufferUtil.toString(obj.item) : obj.item,
                type: obj.type,
            };
            if ("error" in obj) {
                r.error = obj.error;
            }
            options.stream?.push(JSON.stringify(r));
        });
        options.streamRm = streamRm;
    }
}

/** @internal */
async function _move(src: fs.PathLike, dst: fs.PathLike, options: MoveOptionsInternal) {
    createStreams(options);
    const isBuffer = Buffer.isBuffer(src) || Buffer.isBuffer(dst);
    src = util.toStringOrBuffer(isBuffer, src);
    dst = util.toStringOrBuffer(isBuffer, dst);
    const stat = await checkPaths(src, dst);
    await checkParentPaths(src, stat[0], dst, options);
    if (!isParentRoot(dst)) {
        await mkdirp.promises.mkdirp(NodePath.dirname(dst));
    }
    await doRename(src, dst, options, stat);
    if (options.stream) {
        options.stream.push(null);
    }
}

/** @internal */
type TGetStats = [
    statSrc: fs.Stats | fs.BigIntStats,
    statDest: fs.Stats | fs.BigIntStats | undefined,
    isChangingName: boolean
];

/** @internal */
async function checkPaths(src: _PathLike, dst: _PathLike): Promise<TGetStats> {
    const stats = await getStats(src, dst);

    if (stats?.[1]) {
        if (areIdentical(stats[0], stats[1])) {
            const srcBaseName = NodePath.basename(src);
            const dstBaseName = NodePath.basename(dst);
            const srcLc = Buffer.isBuffer(srcBaseName)
                ? BufferUtil.toString(srcBaseName).toLowerCase()
                : srcBaseName.toLowerCase();
            const dstLc = Buffer.isBuffer(dstBaseName)
                ? BufferUtil.toString(dstBaseName).toLowerCase()
                : dstBaseName.toLowerCase();

            /* istanbul ignore next */
            if (!util.equal(srcBaseName, dstBaseName) && srcLc === dstLc) {
                return [stats[0], stats[1], true];
            }
            const e = createError("EINVAL", "Source and destination must not be the same.");
            throw e;
        }
        /* istanbul ignore next */
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
    /* istanbul ignore next */
    if (stats?.[0].isDirectory() && isSrcSubdir(src, dst)) {
        const e = createError("EINVAL", `Cannot move '${src}' to a subdirectory of self '${dst}'`);
        throw e;
    }
    return stats;
}

/** @internal */
async function getStats(src: _PathLike, dst: _PathLike): Promise<TGetStats> {
    const statSrc = await fs.promises.lstat(src);
    try {
        const statDst = await fs.promises.lstat(dst);
        return [statSrc, statDst, false];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return [statSrc, undefined as never, false];
        }
        /* istanbul ignore next */
        throw err;
    }
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
    return (srcArr as Array<_PathLike>).reduce((acc, cur, i) => acc && util.equal(dstArr[i], cur), true);
}

// Recursively check if dest parent is a subdirectory of src.
// It works for all file types including symlinks since it
// checks the src and dest inodes. It starts from the deepest
// parent and stops once it reaches the src parent or the root path.
/** @internal */
async function checkParentPaths(
    src: _PathLike,
    srcStat: fs.Stats | fs.BigIntStats,
    dst: _PathLike,
    options: MoveOptionsInternal
): Promise<void> {
    const srcParent = NodePath.resolve(NodePath.dirname(src));
    const dstParent = NodePath.resolve(NodePath.dirname(dst));
    if (util.equal(dstParent, srcParent) || util.equal(dstParent, NodePath.parse(dstParent).root)) {
        return;
    }
    try {
        const dstStat = await fs.promises.lstat(dst, { bigint: true });
        /* istanbul ignore next */
        if (areIdentical(srcStat, dstStat)) {
            throw createError("EINVAL", `Cannot move '${src}' to a subdirectory of self '${dst}'`);
        }
        return checkParentPaths(src, srcStat, dstParent, options);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return;
        }
        /* istanbul ignore next */
        throw err;
    }
}

/** @internal */
function isParentRoot(dst: _PathLike) {
    const parent = NodePath.dirname(dst);
    const parsedPath = NodePath.parse(parent);
    return util.equal(parsedPath.root, parent);
}

/** @internal */
async function doRename(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal, stats: TGetStats): Promise<void> {
    if (stats[2] == true) {
        /* istanbul ignore next */
        return rename(src, dst, options);
    }

    if (stats[1]) {
        const bothDirs = stats[0].isDirectory() && stats[1].isDirectory();
        if (options.merge && bothDirs) {
            const items = await fs.promises.readdir(src);
            for (const item of items) {
                const newSrc = NodePath.join(src, item);
                const newDst = NodePath.join(dst, item);
                await doRename(newSrc, newDst, options, await getStats(newSrc, newDst));
            }
            return;
        }
        if (options.overwrite) {
            await rm.promises.rm(dst, { recursive: true, force: true });
            return rename(src, dst, options);
        }
        /* istanbul ignore next */
        if (options.overwriteNewer && !stats[0].isDirectory()) {
            if (stats[0].mtimeMs > stats[1].mtimeMs) {
                await fs.promises.unlink(dst);
                return rename(src, dst, options);
            }
        }
    }

    if (!(await isWritable(dst))) {
        throw createError("EEXIST", `${dst} item already exists.`);
    }
    return rename(src, dst, options);
}

/** @internal */
async function isWritable(path: _PathLike): Promise<boolean> {
    try {
        await fs.promises.lstat(path);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return true;
        }
    }
    return false;
}

/** @internal */
async function rename(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal): Promise<void> {
    const stat = await fs.promises.stat(src);
    try {
        writeToStream(options, src, stat);
        await fs.promises.rename(src, dst);
    } catch (err) {
        writeToStream(options, src, stat, err as NodeJS.ErrnoException);
        /* istanbul ignore next */
        if ((err as NodeJS.ErrnoException).code !== "EXDEV") {
            throw err;
        }
        return moveAcrossDevice(src, dst, options);
    }
}

/** @internal */
async function moveAcrossDevice(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal): Promise<void> {
    const copyOpt: copy.CopyOptions<string | Buffer> = {
        overwrite: options.overwrite,
        errorOnExist: true,
        preserveTimestamps: true,
    };
    const rmOpt: rm.RmOptions = {
        recursive: true,
        force: true,
    };
    if (options.stream) {
        copyOpt.stream = options.streamCopy;
        rmOpt.stream = options.streamRm;
    }
    await copy.promises.copy(src, dst, copyOpt);
    return rm.promises.rm(src, rmOpt);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Move items in the file system async
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.move(srcPath, dstPath);
     * console.log("Files moved with success");
     * ```
     *
     * @param src - the path to the items being moved
     * @param dst - the destination path to where the items will be moved
     * @param options - options
     * - `overwrite` - Overwrite existing destination items, default to false
     * - `overwriteNewer` - Overwrite only if source file is newer than destination file default `false`
     * this works by checking the last time the files have been modified `stat.mTime`
     * - `bypassRename` - This option allows to bypass the `renameSync` function in patch, because it can
     * stop the event loop in `win32` if the file can't be renamed for some reason
     *  - `stream` - if a stream is passed then it's possible to check the move process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * Note: this doesn't work with `moveSync`
     * - `merge` - Merge items at destination default `false`
     * If overwrite `true` will overwrite items at destination
     * otherwise triggers an error when a file already exists
     */
    export async function move(src: fs.PathLike, dst: fs.PathLike, options?: MoveOptions): Promise<void> {
        const opt = getOptions(options);
        return _move(src, dst, opt);
    }
}

/**
 * Move items in the file system sync
 * 
  * ```js
 * import * as fs from "fs-extender"
 * fs.moveSync(srcPath, dstPath)
 * console.log("Files moved with success");
 * ```

 * 
 * @param src - the path to the items being moved
 * @param dst - the destination path to where the items will be moved
 * @param options - options
 * - `overwrite` - Overwrite existing destination items, default to false
 * - `overwriteNewer` - Overwrite only if source file is newer than destination file default `false`
 * this works by checking the last time the files have been modified `stat.mTime`
 * - `bypassRename` - This option allows to bypass the `renameSync` function in patch, because it can
 * stop the event loop in `win32` if the file can't be renamed for some reason
 * - `merge` - Merge items at destination default `false`
 * If overwrite `true` will overwrite items at destination
 * otherwise triggers an error when a file already exists
 */
export function moveSync(src: fs.PathLike, dst: fs.PathLike, options?: MoveOptions): void {
    const opt = getOptions(options);
    const isBuffer = Buffer.isBuffer(src) || Buffer.isBuffer(dst);
    src = util.toStringOrBuffer(isBuffer, src);
    dst = util.toStringOrBuffer(isBuffer, dst);
    const stats = checkPathsSync(src, dst);
    if (!isParentRoot(dst)) {
        mkdirp.mkdirpSync(NodePath.dirname(dst));
    }
    doRenameSync(src, dst, opt, stats);
}

/** @internal */
function checkPathsSync(src: _PathLike, dst: _PathLike): TGetStats {
    const stats = getStatsSync(src, dst);

    if (stats?.[1]) {
        if (areIdentical(stats[0], stats[1])) {
            const srcBaseName = NodePath.basename(src);
            const dstBaseName = NodePath.basename(dst);
            const srcLc = Buffer.isBuffer(srcBaseName)
                ? BufferUtil.toString(srcBaseName).toLowerCase()
                : srcBaseName.toLowerCase();
            const dstLc = Buffer.isBuffer(dstBaseName)
                ? BufferUtil.toString(dstBaseName).toLowerCase()
                : dstBaseName.toLowerCase();
            if (srcBaseName !== dstBaseName && srcLc === dstLc) {
                /* istanbul ignore next */
                return [stats[0], stats[1], true];
            }
            const e = createError("EINVAL", "Source and destination must not be the same.");
            throw e;
        }
        /* istanbul ignore next */
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
    /* istanbul ignore next */
    if (stats?.[0].isDirectory() && isSrcSubdir(src, dst)) {
        const e = createError("EINVAL", `Cannot move '${src}' to a subdirectory of self '${dst}'`);
        throw e;
    }
    return stats;
}

/** @internal */
function getStatsSync(src: _PathLike, dst: _PathLike): TGetStats {
    const statSrc = fs.lstatSync(src);
    try {
        const statDst = fs.lstatSync(dst);
        return [statSrc, statDst, false];
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return [statSrc, undefined as never, false];
        }
        /* istanbul ignore next */
        throw err;
    }
}

/** @internal */
function doRenameSync(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal, stats: TGetStats): void {
    if (stats[2] === true) {
        /* istanbul ignore next */
        return renameSync(src, dst, options);
    }

    if (stats[1]) {
        const bothDirs = stats[0].isDirectory() && stats[1].isDirectory();
        if (options.merge && bothDirs) {
            const items = fs.readdirSync(src);
            for (const item of items) {
                const newSrc = NodePath.join(src, item);
                const newDst = NodePath.join(dst, item);
                doRenameSync(newSrc, newDst, options, getStatsSync(newSrc, newDst));
            }
            return;
        }
        if (options.overwrite) {
            rm.rmSync(dst, { recursive: true, force: true });
            return renameSync(src, dst, options);
        }
        /* istanbul ignore next */
        if (options.overwriteNewer && !stats[0].isDirectory()) {
            if (stats[0].mtimeMs > stats[1].mtimeMs) {
                fs.unlinkSync(dst);
                return renameSync(src, dst, options);
            }
        }
    }

    if (!isWritableSync(dst)) {
        throw createError("EEXIST", `${dst} item already exists.`);
    }
    return renameSync(src, dst, options);
}

/** @internal */
function isWritableSync(path: _PathLike): boolean {
    try {
        fs.lstatSync(path);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
            return true;
        }
    }
    return false;
}

/** @internal */
function renameSync(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal) {
    try {
        /* istanbul ignore next */
        if (IsWindows && options.bypassRename) {
            Reflect.apply(NodeFs.renameSync, fs, [src, dst]);
        } else {
            fs.renameSync(src, dst);
        }
    } catch (err) {
        /* istanbul ignore next */
        if ((err as NodeJS.ErrnoException).code !== "EXDEV") {
            throw err;
        }
        moveAcrossDeviceSync(src, dst, options);
    }
}

/** @internal */
function moveAcrossDeviceSync(src: _PathLike, dst: _PathLike, options: MoveOptionsInternal) {
    copy.copySync(src, dst, {
        overwrite: options.overwrite,
        errorOnExist: true,
        preserveTimestamps: true,
    });
    rm.rmSync(src, { recursive: true, force: true, maxRetries: 2 });
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

/** @internal */
function createError(code: string, message: string): Error {
    const error: NodeJS.ErrnoException = new Error(message);
    error.code = code;
    return error;
}
