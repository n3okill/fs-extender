import * as fs from "../patch";
import * as util from "../util";
import * as list from "../list";

export type SizeOptions = {
    /** Dereference links, default is false */
    dereference?: boolean;
    /** the final depth to list, default is -1, will list everything */
    depth?: number;
    /** Ignore error's when accessing to files or directories, default is false */
    ignoreAccessError?: boolean;
    enconding?: BufferEncoding | "buffer";
};

export type SizeStats = {
    totalItems: number;
    totalSize: number;
    files: number;
    filesSize: number;
    directories: number;
    links: number;
    blockDevices: number;
    fifos: number;
    sockets: number;
    characterDevices: number;
};

/** @internal */
type _SizeOptionsInternal = Required<SizeOptions>;

/** @internal */
function getOptions(opt?: unknown): _SizeOptionsInternal {
    return {
        depth: util.getObjectOption(opt, "depth", -1),
        dereference: util.getObjectOption(opt, "dereference", false),
        ignoreAccessError: util.getObjectOption(opt, "ignoreAccessError", false),
        enconding: util.getObjectOption(opt, "encoding", "utf8"),
    };
}

/**
 * Check the size of an item, if `path` is a directory then will list all the items and return their size
 *
 * ```js
 * import * as fs from "fs-extender";
 * fs.size(path,(err, sizeStats)=>{
 *  console.log(sizeStats);
 * });
 * ```
 *
 * @param path - fs.PathLike
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * @param callback - (err: NodeJs.ErrNoException | null, result: SizeStats)
 *
 *  - `SizeStats`
 *      -- totalItems: number;
 *      -- totalSize: number;
 *      -- files: number;
 *      -- filesSize: number;
 *      -- directories: number;
 *      -- links: number;
 *      -- blockDevices: number;
 *      -- fifos: number;
 *      -- sockets: number;
 *      -- characterDevices: number;
 */
export function size(
    path: fs.PathLike,
    options: SizeOptions,
    callback: (err: NodeJS.ErrnoException | null, stats: SizeStats) => void
): void;
export function size(path: fs.PathLike, callback: (err: NodeJS.ErrnoException | null, stats: SizeStats) => void): void;
export function size(path: fs.PathLike, options: unknown, callback?: unknown): void {
    const cb = util.getCallback(options, callback);
    _size(path, getOptions(options))
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/** @internal */
/* istanbul ignore next */
async function _size(path: fs.PathLike, options: _SizeOptionsInternal): Promise<SizeStats> {
    const items = await list.promises.list(path, {
        depth: options.depth,
        dereference: options.dereference,
        ignoreAccessError: options.ignoreAccessError,
        encoding: options.enconding,
    });
    return {
        totalItems: items.length,
        totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
        files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
        filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
        directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
        links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
        blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
        fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
        sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
        characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
    };
}

/**
 * Check the size of an item, if `path` is a directory then will list all the items and return their size
 *
 * ```js
 * import * as fs from "fs-extender";
 * const sizeStats = fs.sizeSync(path);
 *  console.log(sizeStats);
 * ```
 *
 * @param path - fs.PathLike
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
 * - `depth` - the final depth to list, default is `-1`, will list everything
 * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
 *                 If path sent to find is a `buffer` this options will be set to `buffer`
 * @param SizeStats
 *
 *  - `SizeStats`
 *      -- totalItems: number;
 *      -- totalSize: number;
 *      -- files: number;
 *      -- filesSize: number;
 *      -- directories: number;
 *      -- links: number;
 *      -- blockDevices: number;
 *      -- fifos: number;
 *      -- sockets: number;
 *      -- characterDevices: number;
 */
/* istanbul ignore next */
export function sizeSync(path: fs.PathLike, options?: SizeOptions): SizeStats {
    const opt = getOptions(options);
    const items = list.listSync(path, {
        dereference: opt.dereference,
        depth: opt.depth,
        ignoreAccessError: opt.ignoreAccessError,
        encoding: opt.enconding,
    });
    return {
        totalItems: items.length,
        totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
        files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
        filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
        directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
        links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
        blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
        fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
        sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
        characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
    };
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Check the size of an item, if `path` is a directory then will list all the items and return their size
     *
     * ```js
     * import * as fs from "fs-extender";
     * const sizeStats = await fs.promises.size(path)
     *  console.log(sizeStats);
     * ```
     *
     * @param path - fs.PathLike
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * - `ignoreAccessError` - Ignore error's when accessing to files or directories, default is `false`
     * - `depth` - the final depth to list, default is `-1`, will list everything
     * - `encoding` - The `BufferEncoding` to use with readdir default: `utf8`
     *                 If path sent to find is a `buffer` this options will be set to `buffer`
     * @param Promise<SizeStats>
     *
     *  - `SizeStats`
     *      -- totalItems: number;
     *      -- totalSize: number;
     *      -- files: number;
     *      -- filesSize: number;
     *      -- directories: number;
     *      -- links: number;
     *      -- blockDevices: number;
     *      -- fifos: number;
     *      -- sockets: number;
     *      -- characterDevices: number;
     */
    export function size(path: fs.PathLike, options?: SizeOptions): Promise<SizeStats> {
        return _size(path, getOptions(options));
    }
}
