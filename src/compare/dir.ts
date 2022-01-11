import NodePath from "path-extender";
import * as _list from "../list/index.js";
import * as fs from "../patch/patch.js";
import * as util from "../util.js";
import * as compareFile from "./file.js";
import * as internal from "./_internal.js";

/** @internal */
async function compareFiles(
    compareFn: CallableFunction,
    dir1: fs.PathLike,
    dir2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const isBuffer = Buffer.isBuffer(dir1) || Buffer.isBuffer(dir2);
    const d1 = util.toStringOrBuffer(isBuffer, dir1);
    const d2 = util.toStringOrBuffer(isBuffer, dir2);

    const items1 = await _list.promises.list(d1, {
        dereference: options.dereference,
    });
    const items2 = await _list.promises.list(d2, {
        dereference: options.dereference,
    });
    if (
        items1.length !== items2.length ||
        items1.reduce((prev, curr) => prev + curr.stats.size, 0) !==
            items2.reduce((prev, curr) => prev + curr.stats.size, 0)
    ) {
        return false;
    }
    const files1 = items1.filter((f) => f.stats.isFile());
    const files2 = items2.filter((f) => f.stats.isFile());
    const files2Reduced = files2.map((i) => util.replace(i.path, d2, ""));
    let size = files1.length;
    while (size-- > 0) {
        const pathReduced = util.replace(files1[size].path, d1, "");
        const index = files2Reduced.indexOf(pathReduced);
        /* istanbul ignore next */
        if (index === -1) {
            return false;
        }
        const result = await compareFn(files1[size].path, files2[index].path, options);
        /* istanbul ignore next */
        if (result === false) {
            return false;
        }
    }
    return true;
}

/** @internal */
/* istanbul ignore next */
async function statCompare(
    dir1: fs.PathLike,
    dir2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const stat = options.dereference ? fs.promises.stat : fs.promises.lstat;
    const stat1 = await stat(dir1);
    if (!stat1.isDirectory()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${dir1}' is not a directory`);
        }
    }
    const stat2 = await stat(dir2);
    if (!stat2.isDirectory()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${dir2}' is not a directory`);
        }
    }
    return true;
}

/** @internal */
async function _dirByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const dir1 = NodePath.resolve(path1);
    const dir2 = NodePath.resolve(path2);
    if ((await statCompare(dir1, dir2, options)) === true) {
        return compareFiles(compareFile.promises.filesByte, dir1, dir2, options);
    }
    /* istanbul ignore next */
    return false;
}

/**
 * Compare two directories in a byte-to-byte file comparison
 * Note: This method will compare all sub-folder's
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.dirByte(dir1, dir2,(err, areEqual)=>{
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * });
 * ```
 *
 * @param path1 - the path to the first directory
 * @param path2 - the path to the second directory
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `chunkSize` - the size in bytes used to verify equality default to `8192`
 * @param callback - the callback function that will be called after the comparison is done
 * @return {Error|boolean}
 */
export function dirByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal.CompareOptionsByte | undefined,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
export function dirByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
/* istanbul ignore next */
export function dirByte(path1: fs.PathLike, path2: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = internal.getOptions(options);
    const cb = util.getCallback(options, callback);
    _dirByte(path1, path2, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/** @internal */
async function _dirHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const dir1 = NodePath.resolve(path1);
    const dir2 = NodePath.resolve(path2);
    if ((await statCompare(dir1, dir2, options)) === true) {
        return compareFiles(compareFile.promises.filesHash, dir1, dir2, options);
    }
    return false;
}

/**
 * Compare two directories with a hash file comparison
 * Note: This method will compare all sub-folder's
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.dirHash(dir1, dir2,(err, areEqual)=>{
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * });
 * ```
 *
 *
 * @param path1 - the path to the first directory
 * @param path2 - the path to the second directory
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `hash` - the type of hash to use in comparison, default to `sha512`
 * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
 * - `ignoreError` - If true will ignore error's when trying to compare a path that is not a directory, default: false
 * @param callback - the callback function that will be called after the comparison is done
 * @return {Error|boolean}
 */
export function dirHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal.CompareOptionsHash | undefined,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
export function dirHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
/* istanbul ignore next */
export function dirHash(path1: fs.PathLike, path2: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = internal.getOptions(options);
    const cb = util.getCallback(options, callback);
    _dirHash(path1, path2, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Compare two directories with a hash file comparison
     * Note: This method will compare all sub-folder's
     *
     * ```js
     * import * as fs from "fs-extender"
     * const areEqual = await fs.promises.dirHash(dir1, dir2);
     *  if(areEqual){
     *      console.log("Are equal");
     *  }
     * ```
     *
     * @param path1 - the path to the first directory
     * @param path2 - the path to the second directory
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * - `hash` - the type of hash to use in comparison, default to `sha512`
     * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
     * @return {Promise<boolean>}
     */
    export async function dirHash(
        path1: fs.PathLike,
        path2: fs.PathLike,
        options?: internal.CompareOptionsHash
    ): Promise<boolean> {
        const opt = internal.getOptions(options);
        return _dirHash(path1, path2, opt);
    }
    /**
     * Compare two directories in a byte-to-byte file comparison
     * Note: This method will compare all sub-folder's
     *
     * ```js
     * import * as fs from "fs-extender"
     * const areEqual = await fs.promises.dirByte(dir1, dir2);
     *  if(areEqual){
     *      console.log("Are equal");
     *  }
     * ```
     *
     * @param path1 - the path to the first directory
     * @param path2 - the path to the second directory
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * - `chunkSize` - the size in bytes used to verify equality default to `8192`
     * @return {Promise<boolean>}
     */
    export async function dirByte(
        path1: fs.PathLike,
        path2: fs.PathLike,
        options?: internal.CompareOptionsByte
    ): Promise<boolean> {
        const opt = internal.getOptions(options);
        return _dirByte(path1, path2, opt);
    }
}

/** @internal */
/* istanbul ignore next */
function statCompareSync(dir1: fs.PathLike, dir2: fs.PathLike, options: internal._CompareOptionsInternal): boolean {
    const statSync = options.dereference ? fs.statSync : fs.lstatSync;

    const stat1 = statSync(dir1);
    const stat2 = statSync(dir2);
    if (!stat1.isDirectory()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${dir1}' is not a directory`);
        }
    }
    if (!stat2.isDirectory()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${dir2}' is not a directory`);
        }
    }
    return true;
}

/** @internal */
function compareFilesSync(
    compareFn: CallableFunction,
    dir1: fs.PathLike,
    dir2: fs.PathLike,
    options: internal._CompareOptionsInternal
): boolean {
    const isBuffer = Buffer.isBuffer(dir1) || Buffer.isBuffer(dir2);
    const d1 = util.toStringOrBuffer(isBuffer, dir1);
    const d2 = util.toStringOrBuffer(isBuffer, dir2);
    const items1 = _list.listSync(d1, { dereference: options.dereference });
    const items2 = _list.listSync(d2, { dereference: options.dereference });
    /* istanbul ignore next */
    if (items1.length !== items2.length) {
        return false;
    }
    const files1 = items1.filter((f): boolean => f.stats.isFile());
    const files2 = items2.filter((f): boolean => f.stats.isFile());
    const files2Reduced = files2.map((i) => util.replace(i.path, d2, ""));
    let size = files1.length;
    while (size-- > 0) {
        const pathReduced = util.replace(files1[size].path, d1, "");
        const index = files2Reduced.indexOf(pathReduced);
        /* istanbul ignore next */
        if (index === -1) {
            return false;
        }
        const result = compareFn(files1[size].path, files2[index].path, options);
        if (result === false) {
            return false;
        }
    }
    return true;
}

/**
 * Compare two directories in a byte-to-byte file comparison
 * Note: This method will compare all sub-folder's
 *
 * ```js
 * import * as fs from "fs-extender"
 * const areEqual = fs.dirByteSync(dir1, dir2);
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * ```
 *
 * @param path1 - the path to the first directory
 * @param path2 - the path to the second directory
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `chunkSize` - the size in bytes used to verify equality default to `8192`
 * @return {boolean}
 */
export function dirByteSync(path1: fs.PathLike, path2: fs.PathLike, options?: internal.CompareOptionsByte): boolean {
    const opt = internal.getOptions(options) as internal._CompareOptionsInternal;
    const dir1 = NodePath.resolve(path1);
    const dir2 = NodePath.resolve(path2);
    if (statCompareSync(dir1, dir2, opt) === true) {
        return compareFilesSync(compareFile.filesByteSync, dir1, dir2, opt);
    }
    /* istanbul ignore next */
    return false;
}

/**
 * Compare two directories with a hash file comparison
 * Note: This method will compare all sub-folder's
 *
 * * ```js
 * import * as fs from "fs-extender"
 * const areEqual = fs.dirHashSync(dir1, dir2);
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * ```
 *
 * @param path1 - the path to the first directory
 * @param path2 - the path to the second directory
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `hash` - the type of hash to use in comparison, default to `sha512`
 * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
 * - `ignoreError` - If true will ignore error's when trying to compare a path that is not a directory, default: false
 * @return {boolean}
 */
export function dirHashSync(path1: fs.PathLike, path2: fs.PathLike, options?: internal.CompareOptionsHash): boolean {
    const opt = internal.getOptions(options);

    const dir1 = NodePath.resolve(path1);
    const dir2 = NodePath.resolve(path2);
    if (statCompareSync(dir1, dir2, opt) === true) {
        return compareFilesSync(compareFile.filesHashSync, dir1, dir2, opt);
    }
    return false;
}
