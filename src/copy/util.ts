import { Type } from "@n3okill/utils";
import { FindFilterType, FindResultType, FindFilterTypeAsync } from "../find";
import * as fs from "../patch";
import * as util from "../util";
import { Readable } from "stream";

export { ItemType, getItemType, getItemTypeName } from "../util";

/** Options for stream creation when stream is true */
export type CopyOptionsErrorStream = {
    path: fs.PathLike;
    flags?: string;
    encoding?: string;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
};

/** Options for copy */
export type CopyOptions<T> = {
    /** Overwrite destination items if they already exist, default to false */
    overwrite?: boolean;
    /** Overwrite destination items only if items being copied are newer, default is false */
    overwriteNewer?: boolean;
    /** Stop when an error is encountered, default is true */
    stopOnError?: boolean;
    /** Dereference link, default is false */
    dereference?: boolean;
    /** Options about what to do with occurring errors, if null will be temporarily saved in an array
     * otherwise will be written to a stream defined by the user, default to null
     * and will only be used if stopOnError is false*/
    errors?: null | CopyOptionsErrorStream | Array<NodeJS.ErrnoException>;
    /** return an error if file to be copied already exists when overwrite and overwriteNewer is false (default true) */
    errorOnExist?: boolean;
    /**
     *  Filter to be used in files, if set only items matching the filter will be copied.
     */
    filter?: FindFilterType<T>;
    /** Size of the buffer to be used when copying files, default is (64 * 1024) */
    BUFFER_LENGTH?: number;
    /** When true, will set last modification and access times to the ones of the original source files.
     * When false, timestamp behavior is OS-dependent. Default is `false`.
     * used only in `copySync` */
    preserveTimestamps?: boolean;
    /** Should copy items recursively (default true) */
    //recursive?: boolean;
    /** the final depth to copy items, default is -1, will copy everything */
    depth?: number;
    /** if a stream is passed then it's possible to check the copy process with
     * <pre>
     * stream.on("data",(chunk:string)=>{
     *    const obj:StreamOutType = JSON.parse(chunk);
     * });
     * </pre>
     * this doesn't work with `copySync`
     */
    stream?: Readable;
    /** If `true` will ignore the copy of empty folder's default `false` */
    ignoreEmptyFolders?: boolean;
};

export type CopyOptionsAsync<T> = Omit<CopyOptions<T>, "filter"> & {
    filter: FindFilterTypeAsync<T>;
};

/** Returned object after items copied */
export type CopyStats = {
    copied: {
        /** Number of copied files */
        files: number;
        /** Number of copied directories */
        directories: number;
        /** Number of copied links */
        links: number;
        /** Size copied */
        size: number;
        /** Total time taken to copy */
        time: number;
    };
    /** Number of items overwrited, only if `overwrite` is `true` */
    overwrited: number;
    /** Number of items skipped */
    skipped: number;
    /** Total size of items to copy at start */
    size: number;
    /** Array of errors that occurred while copying, only when `stopOnError` is `false` */
    errors: number;
    /** Number of items to copy at start */
    items: number;
};

/** @internal */
export type _CopyOptionsInternal<T = string | Buffer> = Required<
    Omit<CopyOptions<T>, "filter" | "stream" | "streamEncoding">
> & {
    filter?: FindFilterType<T>;
    statistics: CopyStats;
    itemsToCopy?: Array<FindResultType<string | Buffer>>;
    src: string | Buffer;
    dst: string | Buffer;
    BUFFER_LENGTH: number;
    stream?: Readable;
    streamEncoding?: BufferEncoding;
    startTime: Date;
};

/** @internal */
export function getOptions<T>(opt?: unknown, callback?: unknown): _CopyOptionsInternal<T> {
    let filter;
    if ((Type.isFunctionType(opt) && callback) || Type.isRegExp(opt)) {
        filter = opt as FindFilterType<T>;
    }

    return {
        overwrite: util.getObjectOption(opt, "overwrite", false),
        overwriteNewer: util.getObjectOption(opt, "overwriteNewer", false),
        stopOnError: util.getObjectOption(opt, "stopOnError", true),
        dereference: util.getObjectOption(opt, "dereference", false),
        errors: util.getObjectOption(opt, "errors", null),
        preserveTimestamps: util.getObjectOption(opt, "preserveTimestamps", false),
        errorOnExist: util.getObjectOption(opt, "errorOnExist", true),
        statistics: {
            copied: { files: 0, directories: 0, links: 0, size: 0, time: 0 },
            overwrited: 0,
            skipped: 0,
            size: 0,
            errors: 0,
            items: 0,
        } as CopyStats,
        filter: util.getObjectOption(opt, "filter", filter),
        depth: util.getObjectOption(opt, "depth", -1),
        BUFFER_LENGTH: util.getObjectOption(opt, "BUFFER_LENGTH", 64 * 1024),
        src: "",
        dst: "",
        itemsToCopy: [],
        stream: util.getObjectOption(opt, "stream", undefined),
        startTime: new Date(),
        ignoreEmptyFolders: util.getObjectOption(opt, "ignoreEmptyFolder", false),
    };
}

export type CopyStreamOutType = {
    /** Total items to copy */
    totalItems: number;
    /** Number of items copied */
    itemsCopied: number;
    /** Type of item to copy */
    type: string;
    /** Path to item to copy */
    item: string | Buffer;
    /** Size of item to copy */
    size: number;
    /** Estimated time to end */
    eta: number;
    /** Time taken until now */
    timeTaken: number;
    /** Set only if there was an error copying the item */
    error?: NodeJS.ErrnoException;
};

export { getCallback } from "../util";

/** @internal */
export async function utimesMillis(
    path: fs.PathLike,
    atime: string | number | Date,
    mtime: string | number | Date
): Promise<void> {
    const fd = await fs.promises.open(path, "r+");
    await fd.utimes(atime, mtime);
    fd.close();
}

/** @internal */
export function utimesMillisSync(
    path: fs.PathLike,
    atime: string | number | Date,
    mtime: string | number | Date
): void {
    const fd = fs.openSync(path, "r+");
    fs.futimesSync(fd, atime, mtime);
    fs.closeSync(fd);
}
