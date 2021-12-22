import NodePath from "path-extender";
import * as fs from "../patch";
import * as util from "../util";
import * as mkdirp from "../mkdirp";
import { platform } from "os";
import { Readable } from "stream";
import * as list from "../list";

/** @hidden */
const IsWindows = /^win/.test(platform());

export type RmStreamOutType = {
    type: string;
    item: string | Buffer;
    error?: NodeJS.ErrnoException;
};

/** Options for enfsrm */
export type RmOptions = {
    /** This options prevents accidentally removing the disc root item, default to `false`
     * If `true` will allow to remove all data in the drive, if no error occur */
    noPreserveRoot?: boolean;
    /**
     * When `true`, exceptions will be ignored if path does not exist. Default: `false`.
     */
    force?: boolean;
    /**
     * If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
     * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
     * This option represents the number of retries. This option is ignored if the recursive option is not true.
     * Default: 0.
     */
    maxRetries?: number;
    /**
     * If `true`, perform a recursive directory removal.
     * In recursive mode, operations are retried on failure. Default: `false`.
     */
    recursive?: boolean;
    /**
     * The amount of time in milliseconds to wait between retries.
     * This option is ignored if the recursive option is not true. Default: `100`.
     */
    retryDelay?: number;
    /** if a stream is passed then it's possible to check the rm process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * this doesn't work with `rmSync` or `emptyDirSync`
     */
    stream?: Readable;
};

export type EmptyDirOptions = {
    /**
     * When `true`, exceptions will be ignored if path does not exist. Default: `false`.
     */
    force?: boolean;
    /**
     * If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
     * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
     * This option represents the number of retries. This option is ignored if the recursive option is not true.
     * Default: 0.
     */
    maxRetries?: number;
    /**
     * The amount of time in milliseconds to wait between retries.
     * This option is ignored if the recursive option is not true. Default: `100`.
     */
    retryDelay?: number;
    /** if a stream is passed then it's possible to check the rm process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * this doesn't work with `rmSync` or `emptyDirSync`
     */
    stream?: Readable;
};

/**@internal */
type _RmOptionsInternal = Required<Omit<RmOptions, "stream">> & {
    stream?: Readable;
};

/**@internal */
type _EmptyDirOptionsInternal = Required<Omit<EmptyDirOptions, "stream">> & {
    recursive: boolean;
    stream?: Readable;
};

/**@internal */
function getOptions(opt: unknown): _RmOptionsInternal {
    return {
        noPreserveRoot: util.getObjectOption(opt, "noPreserveRoot", false),
        force: util.getObjectOption(opt, "force", false),
        maxRetries: util.getObjectOption(opt, "maxRetries", 0),
        recursive: util.getObjectOption(opt, "recursive", false),
        retryDelay: util.getObjectOption(opt, "retryDelay", 100),
        stream: util.getObjectOption(opt, "stream", undefined),
    };
}

/**@internal */
function getOptionsEmptyDir(opt: unknown): _EmptyDirOptionsInternal {
    return {
        force: util.getObjectOption(opt, "force", false),
        maxRetries: util.getObjectOption(opt, "maxRetries", 0),
        recursive: true,
        retryDelay: util.getObjectOption(opt, "retryDelay", 100),
        stream: util.getObjectOption(opt, "stream", undefined),
    };
}

/**@internal */
function writeToStream(
    options: _RmOptionsInternal | _EmptyDirOptionsInternal,
    path: string | Buffer,
    stats: fs.Stats,
    err?: NodeJS.ErrnoException
): void {
    if (options.stream) {
        const obj: RmStreamOutType = {
            type: util.getItemTypeName(util.getItemType(stats)),
            item: path,
        };
        if (err) {
            obj.error = err;
        }
        options.stream.push(JSON.stringify(obj));
    }
}

/**@internal */
function isRootPath(path: string | Buffer, options: RmOptions): Error | void {
    const root = NodePath.parse(path).root;
    if (util.equal(path, root) && !options.noPreserveRoot) {
        const e = new Error(`To remove '${root}' the 'noPreserveRoot' must be specified as true in options.`);
        (e as NodeJS.ErrnoException).code = "EPERM";
        return e;
    }
}

/**
 * Emulate rm -rf command in node
 *
 * ```js
 * import * as fs from "fs-extender";
import { parseBoolean } from '../util';
 * fs.rm(path,(err)=>{
 *  if(!err) {
 *      console.log("item removed with success.");
 *  }
 * });
 * ```
 *
 * @param path - path to remove
 * @param options - options
 * - `noPreserveRoot` - This options prevents accidentally removing the disc root item, default to `false`
 * If `true` will allow to remove all data in the drive, if no error occur
 * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
 * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
 * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
 * This option represents the number of retries. This option is ignored if the recursive option is not true.
 * Default: 0.
 * - `recursive` - If `true`, perform a recursive directory removal.
 * In recursive mode, operations are retried on failure. Default: `false`.
 * - `retryDelay` - The amount of time in milliseconds to wait between retries.
 * This option is ignored if the recursive option is not true. Default: `100`.
 * - `stream` - if a stream is passed then it's possible to check the rm process with
 * ```js
 * stream.on("data",(chunk:string)=>{
 *    const obj:StreamOutType = JSON.parse(chunk);
 * });
 * ```
 * Note: this doesn't work with `rmSync` or `emptyDirSync`
 *
 * @param callback - function to be called when rm completes
 */
export function rm(
    path: fs.PathLike,
    options: RmOptions | undefined,
    callback: (err: NodeJS.ErrnoException) => void
): void;
export function rm(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void;
export function rm(path: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = getOptions(options);
    const cb = util.getCallback(options, callback);
    path = Buffer.isBuffer(path) ? path : util.fileURLToPath(path);
    const isRoot = isRootPath(path, opt);
    if (isRoot) {
        return cb(isRoot);
    }
    _rm(path, opt)
        .then(() => cb(null))
        .catch((err) => cb(err));
}

/**@internal */
async function _rm(path: string | Buffer, options: _EmptyDirOptionsInternal, ignoreFirst = false): Promise<void> {
    try {
        const stat = await fs.promises.lstat(path);
        /* istanbul ignore next */
        if (stat.isDirectory() && !options.recursive) {
            const err: NodeJS.ErrnoException = new Error(
                `Path is a directory: rm returned EISDIR (is a directory) '${path}'`
            );
            err.code = "EISDIR";
            throw err;
        }
        if (stat.isFile()) {
            writeToStream(options, path, stat);
            await fs.promises.unlink(path);
            return;
        }
    } catch (errStat) {
        if ((errStat as NodeJS.ErrnoException).code === "ENOENT" && options.force) {
            return;
        }
        throw errStat;
    }

    const items = await list.promises.list(path);
    if (ignoreFirst) {
        items.shift();
    }
    let stackRetry: Array<list.ListResultType<string | Buffer>> = [];
    if (items.length === 0) {
        return;
    }
    const itemsNotDir = items.filter((i) => !i.stats.isDirectory());
    const itemsIsDir = items.filter((i) => i.stats.isDirectory());
    while (itemsNotDir.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const item = itemsNotDir.pop()!;
        writeToStream(options, item.path, item.stats);
        await fs.promises.unlink(item.path);
    }

    /* istanbul ignore next */
    while (itemsIsDir.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const item = itemsIsDir.pop()!;
        try {
            writeToStream(options, item.path, item.stats);
            await fs.promises.rmdir(item.path);
        } catch (er) {
            const err = er as NodeJS.ErrnoException;
            writeToStream(options, item.path, item.stats, err);
            if (err.code === "ENOENT") {
                const idx = stackRetry.indexOf(item);
                if (idx !== -1) {
                    stackRetry.splice(idx, 1);
                }
                continue;
            }
            if (item.stats.isDirectory()) {
                if (err.code === "EPERM" && IsWindows) {
                    await fs.promises.chmod(item.path, 0o666);
                    //re-list for removal
                    itemsIsDir.push(item);
                } else if (err.code === "ENOTEMPTY" || err.code === "EEXIST" || err.code === "EPERM") {
                    if (stackRetry.indexOf(item) === -1) {
                        stackRetry.push(item);
                    }
                } else {
                    throw err;
                }
                continue;
            }
            throw err;
        }
    }
    stackRetry = stackRetry.reverse();
    /* istanbul ignore next: only happens when file is blocked by the os system */
    if (stackRetry.length > 0) {
        let retries = 0;
        async function retry(item: list.ListResultType<string | Buffer>) {
            try {
                writeToStream(options, item.path, item.stats);
                await fs.promises.rmdir(item.path);
            } catch (err) {
                writeToStream(options, item.path, item.stats, err as NodeJS.ErrnoException);
                if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                    return;
                } else if (
                    ["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"].indexOf(
                        (err as NodeJS.ErrnoException).code as string
                    ) &&
                    retries < options.maxRetries
                ) {
                    retries++;
                    setTimeout(retry, retries * options.retryDelay, item);
                } else if (retries >= options.maxRetries) {
                    throw err;
                }
            }
        }
        const ps = Array.from(stackRetry).map((p) => retry(p));
        await Promise.all(ps);
    }

    if (options.stream /* && !options.stickyStream*/) {
        options.stream.push(null);
    }
}

/**
 * Delete all items inside a directory
 *
 * ```js
 * import * as fs from "fs-extender";
 * fs.emptyDir(path,(err)=>{
 *  if(!err) {
 *      console.log("dir is empty");
 *  }
 * });
 * ```
 *
 * @param path - path to remove
 * @param options - options
 * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
 * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
 * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
 * This option represents the number of retries. Default: 0.
 * - `retryDelay` - The amount of time in milliseconds to wait between retries. Default: `100`.
 * - `stream` - if a stream is passed then it's possible to check the rm process with
 * ```js
 * stream.on("data",(chunk:string)=>{
 *    const obj:StreamOutType = JSON.parse(chunk);
 * });
 * ```
 * Note: this doesn't work with `rmSync` or `emptyDirSync`
 *
 * @param callback - function to be called when rm completes
 */
export function emptyDir(
    path: fs.PathLike,
    options: EmptyDirOptions | undefined,
    callback: (err: NodeJS.ErrnoException) => void
): void;
export function emptyDir(path: fs.PathLike, callback: (err: NodeJS.ErrnoException) => void): void;
export function emptyDir(path: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = getOptionsEmptyDir(options);
    const cb = util.getCallback(options, callback);
    _emptyDir(path, opt)
        .then(() => cb(null))
        .catch((err) => cb(err));
}

/**@internal */
async function _emptyDir(path: fs.PathLike, options: _EmptyDirOptionsInternal): Promise<void> {
    try {
        await fs.promises.readdir(path);
    } catch (err) {
        /* istanbul ignore next */
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
            await mkdirp.promises.mkdirp(path);
            return;
        } else {
            throw err;
        }
    }
    path = Buffer.isBuffer(path) ? path : util.fileURLToPath(path);
    return _rm(path, getOptionsEmptyDir(options), true);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Emulate rm -rf command in node
     *
     * ```js
     * import * as fs from "fs-extender";
     * await fs.promises.rm(path);
     * console.log("item removed with success.");
     * ```
     *
     * @param path - path to remove
     * @param options - options
     * - `noPreserveRoot` - This options prevents accidentally removing the disc root item, default to `false`
     * If `true` will allow to remove all data in the drive, if no error occur
     * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
     * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
     * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
     * This option represents the number of retries. This option is ignored if the recursive option is not true.
     * Default: 0.
     * - `recursive` - If `true`, perform a recursive directory removal.
     * In recursive mode, operations are retried on failure. Default: `false`.
     * - `retryDelay` - The amount of time in milliseconds to wait between retries.
     * This option is ignored if the recursive option is not true. Default: `100`.
     * - `stream` - if a stream is passed then it's possible to check the rm process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * Note: this doesn't work with `rmSync` or `emptyDirSync`
     *
     */
    export async function rm(path: fs.PathLike, options?: RmOptions): Promise<void> {
        const opt = getOptions(options);
        path = Buffer.isBuffer(path) ? path : util.fileURLToPath(path);
        const isRoot = isRootPath(path, opt);
        if (isRoot) {
            throw isRoot;
        }
        return _rm(path, opt);
    }
    /**
     * Delete all items inside a directory
     *
     * ```js
     * import * as fs from "fs-extender";
     * await fs.promises.emptyDir(path);
     * console.log("dir is empty");
     * ```
     *
     * @param path - path to remove
     * @param options - options
     * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
     * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
     * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
     * This option represents the number of retries. Default: 0.
     * - `retryDelay` - The amount of time in milliseconds to wait between retries. Default: `100`.
     * - `stream` - if a stream is passed then it's possible to check the rm process with
     * ```js
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * ```
     * Note: this doesn't work with `rmSync` or `emptyDirSync`
     */
    export async function emptyDir(path: fs.PathLike, options?: EmptyDirOptions): Promise<void> {
        const opt = getOptionsEmptyDir(options);
        return _emptyDir(path, opt);
    }
}

/**
 * Delete all items inside a directory
 *
 * ```js
 * import * as fs from "fs-extender";
 * fs.emptyDirSync(path);
 * console.log("dir is empty");
 * ```
 *
 * @param path - path to remove
 * @param options - options
 * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
 * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
 * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
 * This option represents the number of retries. Default: 0.
 * - `retryDelay` - The amount of time in milliseconds to wait between retries. Default: `100`.
 */
export function emptyDirSync(path: fs.PathLike, options?: EmptyDirOptions): void {
    const opt = getOptionsEmptyDir(options);
    path = Buffer.isBuffer(path) ? path : util.fileURLToPath(path);
    try {
        fs.readdirSync(path);
    } catch (err) {
        /* istanbul ignore next */
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
            mkdirp.mkdirpSync(path);
            return;
        } else {
            throw err;
        }
    }
    _rmSync(path, opt, true);
}

/**
 * Emulate rm -rf command in node
 *
 * ```js
 * import * as fs from "fs-extender";
 * fs.rmSync(path);
 * console.log("item removed with success.");
 * ```
 *
 * @param path - path to remove
 * @param options - options
 * - `noPreserveRoot` - This options prevents accidentally removing the disc root item, default to `false`
 * If `true` will allow to remove all data in the drive, if no error occur
 * - `force` - When `true`, exceptions will be ignored if path does not exist. Default: `false`.
 * - `maxRetries` - If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry
 * the operation with a linear backoff wait of retryDelay milliseconds longer on each try.
 * This option represents the number of retries. This option is ignored if the recursive option is not true.
 * Default: 0.
 * - `recursive` - If `true`, perform a recursive directory removal.
 * In recursive mode, operations are retried on failure. Default: `false`.
 * - `retryDelay` - The amount of time in milliseconds to wait between retries.
 * This option is ignored if the recursive option is not true. Default: `100`.
 */
export function rmSync(path: fs.PathLike, options?: RmOptions): void {
    const opt = getOptions(options) as _RmOptionsInternal;
    path = Buffer.isBuffer(path) ? path : util.fileURLToPath(path);
    const isRoot = isRootPath(path, opt);
    if (isRoot) {
        throw isRoot;
    }
    _rmSync(path, opt);
}

/**@internal */
function _rmSync(path: fs.PathLike, options: _EmptyDirOptionsInternal, ignoreFirst = false): void {
    try {
        const stat = fs.lstatSync(path);
        /* istanbul ignore next */
        if (stat.isDirectory() && !options.recursive) {
            const err: NodeJS.ErrnoException = new Error(
                `Path is a directory: rm returned EISDIR (is a directory) '${path}'`
            );
            err.code = "EISDIR";
            throw err;
        }
        /* istanbul ignore next */
        if (stat.isFile()) {
            fs.unlinkSync(path);
            return;
        }
    } catch (errStat) {
        if ((errStat as NodeJS.ErrnoException).code === "ENOENT" && options.force) {
            return;
        }
        throw errStat;
    }

    const items = list.listSync(path);
    if (ignoreFirst) {
        items.shift();
    }
    let stackRetry: Array<list.ListResultType<string | Buffer>> = [];
    if (items.length === 0) {
        return;
    }

    const itemsNotDir = items.filter((i) => !i.stats.isDirectory());
    const itemsIsDir = items.filter((i) => i.stats.isDirectory());
    while (itemsNotDir.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const item = itemsNotDir.pop()!;
        fs.unlinkSync(item.path);
    }
    /* istanbul ignore next */
    while (itemsIsDir.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const item = itemsIsDir.pop()!;
        try {
            fs.rmdirSync(item.path);
        } catch (er) {
            const err = er as NodeJS.ErrnoException;
            if (err.code === "ENOENT") {
                const idx = stackRetry.indexOf(item);
                if (idx !== -1) {
                    stackRetry.splice(idx, 1);
                }
                continue;
            }
            if (item.stats.isDirectory()) {
                if (err.code === "EPERM" && IsWindows) {
                    fs.chmodSync(item.path, 0o666);
                    //re-list for removal
                    itemsIsDir.push(item);
                } else if (err.code === "ENOTEMPTY" || err.code === "EEXIST" || err.code === "EPERM") {
                    if (stackRetry.indexOf(item) === -1) {
                        stackRetry.push(item);
                    }
                } else {
                    throw err;
                }
                continue;
            }
            throw err;
        }
    }
    stackRetry = stackRetry.reverse();
    /* istanbul ignore next: only happens when file is blocked by the os system */
    while (stackRetry.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const p = stackRetry.pop()!;

        //if we enter here we have sticky bastards
        const tries = options.maxRetries + 1;
        for (let i = 1; i <= tries; i++) {
            try {
                fs.rmdirSync(p.path);
            } catch (err) {
                // Only sleep if this is not the last try, and the delay is greater
                // than zero, and an error was encountered that warrants a retry.
                if (
                    ["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"].indexOf(
                        (err as NodeJS.ErrnoException).code as string
                    ) &&
                    i < tries &&
                    options.retryDelay > 0
                ) {
                    //poor sleeping
                    const stop = Date.now() + i * options.retryDelay;
                    while (stop < Date.now()) {}
                    //sleep(i * options.retryDelay);
                } else if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                    // The file is already gone.
                    continue;
                } else if (i === tries) {
                    throw err;
                }
            }
        }
    }
}
