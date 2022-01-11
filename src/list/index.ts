import * as fs from "../patch/patch.js";
import * as NodeAssert from "assert";
import NodePath from "path-extender";
import * as util from "../util.js";
import { URL } from "url";

/** Return an array of objects with fs.PahLike and fs.Stats */
export type ListResultType<T> = {
    path: T;
    stats: fs.Stats;
};

/** Options used by list */
export type ListOptions = {
    /** Dereference links, default is false */
    dereference?: boolean;
    /** Ignore error's when accessing to files or directories, default is false */
    ignoreAccessError?: boolean;
    /** the final depth to list, default is -1, will list everything */
    depth?: number;
    /**
     * The BufferEncoding to use with readdir default: `utf8`
     * If path sent to list is a buffer this options will be set to `buffer`
     */
    encoding?: BufferEncoding | "buffer";
};

/** @internal */
type _ListOptionsInternal = Required<ListOptions>;

/** @internal */
export function getOptions(opt?: unknown): _ListOptionsInternal {
    return {
        dereference: util.getObjectOption(opt, "dereference", false),
        ignoreAccessError: util.getObjectOption(opt, "ignoreAccessError", false),
        depth: util.getObjectOption(opt, "depth", -1),
        //buffer: util.getObjectOption(opt, "buffer", false),
        encoding: util.getObjectOption(opt, "encoding", "utf8"),
    };
}

/** @internal */
type ListResultTupple = [path: fs.PathLike, stats: fs.Stats];

/**
 * Obtain the list of items under a directory and sub-directories asynchronously.
 * Each item will be an object containing: {path: pathToItem, stat: itemStat}
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.list("c:/",(err, items)=>{
 *  console.log(`${items.length} found`);
 * });
 * ```
 *
 * @param path
 * @param options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * @param callback - (err: Error | null, items: Array<{path: fs.PathLike, stats: fs.Stats}>)
 */
export function list(
    path: fs.PathLike,
    options: ListOptions & { encoding: "buffer" },
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<Buffer>[]) => void
): void;
export function list(
    path: string | URL,
    options: ListOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<string>[]) => void
): void;
export function list(
    path: Buffer,
    options: ListOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<Buffer>[]) => void
): void;
export function list(
    path: string | URL,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<string>[]) => void
): void;
export function list(
    path: Buffer,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<Buffer>[]) => void
): void;
export function list(
    path: fs.PathLike,
    options: ListOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<string | Buffer>[]) => void
): void;
export function list(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, items: ListResultType<string | Buffer>[]) => void
): void;
export function list(path: fs.PathLike, options?: unknown, cb?: unknown): void {
    NodeAssert.ok(path, "'path' is required");

    const opt = getOptions(options);
    const callback = util.getCallback(options, cb);
    _list(path, opt)
        .then((items) => callback(null, items))
        .catch((err) => callback(err));
}

async function _list(path: fs.PathLike, options: _ListOptionsInternal): Promise<unknown[]> {
    let items = [];
    const result: ListResultTupple[] = [];
    const subItems = [];
    let depth = 0;
    if (Buffer.isBuffer(path)) {
        options.encoding = "buffer";
    } else if (options.encoding === "buffer") {
        path = Buffer.from(util.fileURLToPath(path));
    }

    const statFn = options.dereference ? fs.promises.stat : fs.promises.lstat;

    subItems.push({ depth, items: [path] });
    do {
        items = subItems[0].items;
        depth = subItems[0].depth;
        subItems.shift();

        do {
            const item: fs.PathLike = items.shift() as fs.PathLike;
            let stats;
            try {
                stats = await Reflect.apply(statFn, fs, [item]);
            } catch (er) {
                const err = er as NodeJS.ErrnoException;
                if (!(err.code === "ENOENT" && options.ignoreAccessError)) {
                    throw err;
                }
                continue;
            }
            result.push([item, stats]);
            if (stats.isDirectory()) {
                try {
                    if (depth <= options.depth || options.depth === -1) {
                        const its = await fs.promises.readdir(item, {
                            encoding: options.encoding as BufferEncoding,
                        });
                        if (its.length) {
                            subItems.push({
                                depth: depth + 1,
                                items: its.map((m) => NodePath.join(item, m)),
                            });
                        }
                    }
                } catch (er) {
                    const err = er as NodeJS.ErrnoException;
                    /* istanbul ignore next */
                    if (
                        !options.ignoreAccessError ||
                        (options.ignoreAccessError && !(err.code === "EACCES" || err.code === "EPERM"))
                    ) {
                        throw err;
                    }
                }
            }
        } while (items.length);
    } while (subItems.length);

    return result.map((f: ListResultTupple) => ({ path: f[0], stats: f[1] }));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Obtain the list of items under a directory and sub-directories asynchronously.
     * Each item will be an object containing: {path: pathToItem, stat: itemStat}
     *
     * ```js
     * import * as fs from "fs-extender"
     * const items = fs.promises.list("c:/");
     * console.log(`${items.length} found`);
     * ```
     *
     * @param path
     * @param options
     * - `dereference` - Dereference links, default is `false`
     * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
     * - `depth` - the final depth to list, default is `-1`, will list everything
     * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
     *                 If path sent to find is a `buffer` this options will be set to `buffer`
     * @return `Promise<Array<{path: fs.PathLike, stats: fs.Stats}>>`
     */
    export async function list(
        path: fs.PathLike,
        options: ListOptions & { encoding: "buffer" }
    ): Promise<ListResultType<Buffer>[]>;
    export async function list(path: string | URL, options?: ListOptions): Promise<ListResultType<string>[]>;
    export async function list(path: Buffer, options?: ListOptions): Promise<ListResultType<Buffer>[]>;
    export async function list(path: fs.PathLike, options?: ListOptions): Promise<ListResultType<string | Buffer>[]>;
    export async function list(path: fs.PathLike, options?: unknown): Promise<unknown> {
        const opt: ListOptions = getOptions(options);
        return Reflect.apply(_list, fs, [path, opt]);
    }
}

/**
 * Obtain the list of items under a directory and sub-directories synchronously.
 * Each item will be an object containing: {path: pathToItem, stat: itemStat}
 *
 * ```js
 * import * as fs from "fs-extender"
 * const items = fs.listSync("c:/");
 * console.log(`${items.length} found`);
 * ```
 *
 * @param path
 * @param options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * @return `Array<{path: fs.PathLike, stats: fs.Stats}>`
 */
export function listSync(path: fs.PathLike, options: ListOptions & { encoding: "buffer" }): ListResultType<Buffer>[];
export function listSync(path: string | URL, options?: ListOptions): ListResultType<string>[];
export function listSync(path: Buffer, options?: ListOptions): ListResultType<Buffer>[];
export function listSync(path: fs.PathLike, options?: ListOptions): ListResultType<string | Buffer>[];
export function listSync(path: fs.PathLike, options?: unknown): unknown {
    let items = [];
    const result: ListResultTupple[] = [];
    const subItems = [];
    let depth = 0;
    NodeAssert.ok(path, "path must be defined");
    const opt = getOptions(options);
    const statFn = opt.dereference ? fs.statSync : fs.lstatSync;
    if (Buffer.isBuffer(path)) {
        opt.encoding = "buffer";
    } else if (opt.encoding === "buffer") {
        path = Buffer.from(util.fileURLToPath(path));
    }

    subItems.push({ depth, items: [path] });
    do {
        items = subItems[0].items;
        depth = subItems[0].depth;
        subItems.shift();

        do {
            const item: fs.PathLike = items.shift() as fs.PathLike;
            let stats;
            try {
                stats = Reflect.apply(statFn, fs, [item]);
            } catch (er) {
                const err = er as NodeJS.ErrnoException;
                if (!(err.code === "ENOENT" && opt.ignoreAccessError)) {
                    throw err;
                }
                continue;
            }
            result.push([item, stats]);
            if (stats.isDirectory()) {
                try {
                    if (depth <= (opt.depth as number) || opt.depth === -1) {
                        const its = fs.readdirSync(item, {
                            encoding: opt.encoding as never,
                        });
                        if (its.length) {
                            subItems.push({
                                depth: depth + 1,
                                items: its.map((m) => NodePath.join(item, m)),
                            });
                        }
                    }
                } catch (er) {
                    const err = er as NodeJS.ErrnoException;
                    /* istanbul ignore next */
                    if (
                        !opt.ignoreAccessError ||
                        (opt.ignoreAccessError && !(err.code === "EACCES" || err.code === "EPERM"))
                    ) {
                        throw err;
                    }
                }
            }
        } while (items.length);
    } while (subItems.length);

    return result.map((f: ListResultTupple) => ({ path: f[0], stats: f[1] }));
}
