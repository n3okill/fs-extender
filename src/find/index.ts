import * as NodeAssert from "assert";
import * as fs from "../patch";
import * as list from "../list";
import { Type } from "@n3okill/utils";
import * as util from "../util";
import * as NodeUrl from "url";

/** Return an object with fs.PathLike and fs.Stats */
export type FindResultType<T> = list.ListResultType<T>;

export type FindFilterFunction<T> = (path: T, stats: fs.Stats) => boolean;
export type FindFilterFunctionAsync<T> = (path: T, stats: fs.Stats) => boolean | Promise<boolean>;

/** Definition for filter */
export type FindFilterType<T> = RegExp | FindFilterFunction<T>;
export type FindFilterTypeAsync<T> = RegExp | FindFilterFunctionAsync<T>;

/** Options used by find sync */
export type FindOptions<T> = list.ListOptions & {
    filter?: FindFilterType<T>;
};

/** Options used by find async */
export type FindOptionsAsync<T> = list.ListOptions & {
    /** Regexp or function to filter items, default is undefined */
    filter?: FindFilterTypeAsync<T>;
};

/** @internal */
function getOptions<T>(opt?: unknown, callback?: unknown): FindOptionsAsync<T> {
    const options = list.getOptions(opt) as FindOptionsAsync<T>;
    if ((Type.isFunctionType(opt) && callback) || Type.isRegExp(opt)) {
        options.filter = opt as FindFilterType<T>;
    }
    options.filter = util.getObjectOption(opt, "filter", options.filter);
    return options;
}

/** @internal */
async function FilterResult(
    items: list.ListResultType<string | Buffer>[],
    opt: FindOptionsAsync<string | Buffer>
): Promise<FindResultType<string | Buffer>[]> {
    if (opt.filter) {
        if (Type.isRegExp(opt.filter)) {
            return items.filter((item): boolean => {
                (opt.filter as RegExp).lastIndex = 0;
                return (opt.filter as RegExp).test(
                    Buffer.isBuffer(item.path)
                        ? item.path.toString(opt.encoding === "buffer" ? "utf8" : opt.encoding)
                        : item.path
                );
            });
        } else if (Type.isFunction(opt.filter)) {
            return items.filter((item): boolean =>
                (opt.filter as (path: string | Buffer, itemStats: fs.Stats) => boolean)(item.path, item.stats)
            );
        } else if (Type.isAsyncFunction(opt.filter)) {
            const fn = async (arr: Array<FindResultType<string | Buffer>>) => {
                const results = await Promise.all(
                    arr.map(async (value) =>
                        (opt.filter as unknown as FindFilterFunctionAsync<string | Buffer>)(value.path, value.stats)
                    )
                );
                return arr.filter((_v, index) => results[index]);
            };
            return fn(items);
        }
    }
    return items;
}

/**
 * Obtain the list of items under a directory and sub-directories asynchronously
 * applying a filter
 *
 * ```js
 *  //List all files under 'c:/'
 *  import * as fs from "fs-extender"
 *  fs.find("c:/",(path: fs.PathLike, stats: fs.Stats)=>stats.isFile(),
 *  (err: NodeJs.ErroNoException | null, items: Array<{path: fs.PathLike, stats: fs.Stats}>));
 * ```
 *
 * Each item will be an object containing: {path: pathToItem, stat: itemStat}
 * @param path - fs.PathLike
 * @param options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * - `filter` - `RegExp` or `function` to be applied to items
 * @param callback - (err: Error | null, items: Array<{path: fs.PathLike, stats: fs.Stats}>)
 */
export function find(
    path: fs.PathLike,
    options: (FindOptionsAsync<Buffer> & { encoding: "buffer" }) | FindFilterTypeAsync<Buffer>,
    callback: (err: NodeJS.ErrnoException | null, result: FindResultType<Buffer>[]) => void
): void;
export function find(
    path: string | NodeUrl.URL,
    options: FindOptionsAsync<string> | FindFilterTypeAsync<string> | undefined,
    callback: (err: NodeJS.ErrnoException | null, result: FindResultType<string>[]) => void
): void;
export function find(
    path: Buffer,
    options: FindOptionsAsync<Buffer> | FindFilterTypeAsync<Buffer> | undefined,
    callback: (err: NodeJS.ErrnoException | null, result: FindResultType<Buffer>[]) => void
): void;
export function find(
    path: fs.PathLike,
    options: FindOptionsAsync<string | Buffer> | FindFilterTypeAsync<string | Buffer> | undefined,
    callback: (err: NodeJS.ErrnoException | null, items: FindResultType<string | Buffer>[]) => void
): void;
export function find(
    path: string | NodeUrl.URL,
    callback: (err: NodeJS.ErrnoException | null, result: FindResultType<string>[]) => void
): void;
export function find(
    path: Buffer,
    callback: (err: NodeJS.ErrnoException | null, result: FindResultType<Buffer>[]) => void
): void;
export function find(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, items: FindResultType<string | Buffer>[]) => void
): void;
export function find(path: fs.PathLike, options?: unknown, cb?: unknown): void {
    NodeAssert.ok(path, "path is required");

    const opt = getOptions(options, cb);
    const callback = util.getCallback(options, cb);

    _find(path, opt)
        .then((files) => {
            callback(null, files);
        })
        .catch((err) => callback(err));
}

/** @internal */
async function _find(
    path: fs.PathLike,
    options: FindOptionsAsync<string | Buffer>
): Promise<FindResultType<string | Buffer>[]> {
    const items = await list.promises.list(path, {
        encoding: options.encoding,
        dereference: options.dereference,
        depth: options.depth,
        ignoreAccessError: options.ignoreAccessError,
    });
    return FilterResult(items as never, options);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Obtain the list of items under a directory and sub-directories asynchronously
     * applying a filter
     *
     * ```js
     *  //List all files under 'c:/'
     *  import * as fs from "fs-extender"
     *  const items = await fs.promises.find("c:/", (path: fs.PathLike, stats: fs.Stats)=>{
     *      return stats.isFile();
     *  });
     * ```
     *
     * Each item will be an object containing: {path: pathToItem, stat: itemStat}
     * @param path - fs.PathLike
     * @param options
     * - `dereference` - Dereference links, default is `false`
     * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
     * - `depth` - the final depth to list, default is `-1`, will list everything
     * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
     *                 If path sent to find is a `buffer` this options will be set to `buffer`
     * - `filter` - `RegExp` or `function` to be applied to items
     * @return Promise<Array<{path: fs.PathLike, stats: fs.Stats}>>
     */
    export async function find(
        path: fs.PathLike,
        options: (FindOptions<Buffer> & { encoding: "buffer" }) | FindFilterType<Buffer>
    ): Promise<FindResultType<Buffer>[]>;
    export async function find(
        path: string | NodeUrl.URL,
        options?: FindOptionsAsync<string> | FindFilterTypeAsync<string>
    ): Promise<FindResultType<string>[]>;
    export async function find(
        path: Buffer,
        options?: FindOptionsAsync<Buffer> | FindFilterTypeAsync<Buffer>
    ): Promise<FindResultType<Buffer>[]>;
    export async function find(
        path: fs.PathLike,
        options?: FindOptionsAsync<string | Buffer> | FindFilterTypeAsync<string | Buffer>
    ): Promise<FindResultType<string | Buffer>[]>;
    export async function find(path: fs.PathLike, options?: unknown): Promise<unknown> {
        const opt = getOptions(options, true);
        const files = await _find(path, opt);
        return FilterResult(files, opt);
    }
}

/**
 * Obtain the list of items under a directory and sub-directories asynchronously
 * applying a filter
 *
 * ```js
 *  //List all files under 'c:/'
 *  import * as fs from "fs-extender"
 *  const items = fs.findSync("c:/", (path: fs.PathLike, stats: fs.Stats)=>{
 *      return stats.isFile();
 *  });
 * ```
 *
 * Each item will be an object containing: {path: pathToItem, stat: itemStat}
 * @param path - fs.PathLike
 * @param options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * - `filter` - `RegExp` or `function` to be applied to items
 * @return Array<{path: fs.PathLike, stats: fs.Stats}>
 */
export function findSync(
    path: fs.PathLike,
    options: (FindOptions<Buffer> & { encoding: "buffer" }) | FindFilterType<Buffer>
): FindResultType<Buffer>[];
export function findSync(
    path: string | NodeUrl.URL,
    options?: FindOptions<string> | FindFilterType<string>
): FindResultType<string>[];
export function findSync(
    path: Buffer,
    options?: FindOptions<Buffer> | FindFilterType<Buffer>
): FindResultType<Buffer>[];
export function findSync(
    path: fs.PathLike,
    options?: FindOptions<string | Buffer> | FindFilterType<string | Buffer>
): FindResultType<string | Buffer>[];
export function findSync(path: fs.PathLike, options?: unknown): unknown {
    NodeAssert.ok(path, "path is required");
    const opt = getOptions(options, true);
    const result = list.listSync(path, {
        encoding: opt.encoding,
        dereference: opt.dereference,
        depth: opt.depth,
        ignoreAccessError: opt.ignoreAccessError,
    });
    if (opt.filter) {
        if (Type.isRegExp(opt.filter)) {
            return result.filter((item): boolean => {
                (opt.filter as RegExp).lastIndex = 0;
                return (opt.filter as RegExp).test(
                    Buffer.isBuffer(item.path)
                        ? item.path.toString(opt.encoding === "buffer" ? "utf8" : opt.encoding)
                        : item.path
                );
            });
        } else if (Type.isFunction(opt.filter)) {
            return result.filter((item): boolean =>
                (opt.filter as (path: string | Buffer, itemStats: fs.Stats) => boolean)(item.path, item.stats)
            );
        }
    }
    return result;
}
