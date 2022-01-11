import NodePath from "path-extender";
import * as NodeCrypto from "crypto";
import * as fs from "../patch/patch.js";
import * as internal from "./_internal.js";
import * as util from "../util.js";

/** @internal */
function compareFiles(
    file1: fs.PathLike,
    file2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let ended1 = false,
            ended2 = false,
            calledBack = false;
        const stream1 = fs.createReadStream(file1);
        const stream2 = fs.createReadStream(file2);
        let data1 = Buffer.alloc(options.chunkSize);
        let data2 = Buffer.alloc(options.chunkSize);

        function compare(): void {
            if (data1.length >= options.chunkSize && data2.length >= options.chunkSize && !calledBack) {
                const buf1 = data1.slice(0, options.chunkSize);
                const buf2 = data2.slice(0, options.chunkSize);
                /* istanbul ignore next */
                if (!buf1.equals(buf2)) {
                    stream1.destroy();
                    stream2.destroy();
                    calledBack = true;
                    return resolve(false);
                }
                data1 = data1.slice(options.chunkSize);
                data2 = data2.slice(options.chunkSize);
            }
        }

        function compareFinal(): void {
            if (ended1 === true && ended2 === true) {
                if (data1.equals(data2)) {
                    return resolve(true);
                }
                resolve(false);
            }
        }

        /* istanbul ignore next */
        stream1.on("error", (err: NodeJS.ErrnoException): void => {
            stream2.destroy();
            reject(err);
        });
        /* istanbul ignore next */
        stream2.on("error", (err: NodeJS.ErrnoException): void => {
            stream1.destroy();
            reject(err);
        });

        stream1.on("data", (chunk: Buffer): void => {
            data1 = Buffer.concat([data1, chunk]);
            compare();
        });
        stream2.on("data", (chunk: Buffer): void => {
            data2 = Buffer.concat([data2, chunk]);
            compare();
        });
        stream1.on("end", (): void => {
            ended1 = true;
            compareFinal();
        });
        stream2.on("end", (): void => {
            ended2 = true;
            compareFinal();
        });
    });
}

/** @internal */
/* istanbul ignore next */
async function statCompare(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const stat = options.dereference ? fs.promises.stat : fs.promises.lstat;

    const stat1 = await stat(path1);
    if (!stat1.isFile()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${path1}' is not a directory`);
        }
    }
    const stat2 = await stat(path2);
    if (!stat2.isFile()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${path2}' is not a directory`);
        }
    }
    if (stat1.size === stat2.size) {
        return true;
    }
    return false;
}

/** @internal */
async function _filesByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const file1 = NodePath.resolve(path1);
    const file2 = NodePath.resolve(path2);
    const result = await statCompare(file1, file2, options);
    if (result === false) {
        return false;
    }
    return compareFiles(file1, file2, options);
}

/**
 * Compare two files in a byte-to-byte comparison
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.filesByte(file1, file2,(err, areEqual)=>{
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * });
 * ```
 *
 * @param path1 - the path to the first file
 * @param path2 - the path to the second file
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `chunkSize` - Size to use when comparing files, default is `8192`
 * @param callback - the callback function that will be called after the comparison is done
 * @return {Error|boolean}
 */
export function filesByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal.CompareOptionsByte | undefined,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
export function filesByte(
    path1: fs.PathLike,
    path2: fs.PathLike,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
/* istanbul ignore next */
export function filesByte(path1: fs.PathLike, path2: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = internal.getOptions(options);
    const cb = util.getCallback(options, callback);
    _filesByte(path1, path2, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/** @internal */
async function _filesHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal._CompareOptionsInternal
): Promise<boolean> {
    const file1 = NodePath.resolve(path1);
    const file2 = NodePath.resolve(path2);
    const result = await statCompare(file1, file2, options);
    if (result === false) {
        return false;
    }
    return new Promise((resolve, reject) => {
        let done1 = false,
            done2 = false;
        const stream1 = fs.createReadStream(file1);
        const stream2 = fs.createReadStream(file2);
        const hash1 = NodeCrypto.createHash(options.hash);
        const hash2 = NodeCrypto.createHash(options.hash);
        hash1.setEncoding(options.encoding);
        hash2.setEncoding(options.encoding);

        function compare(): void {
            if (done1 === true && done2 === true) {
                return resolve(hash1.read() === hash2.read());
            }
        }

        /* istanbul ignore next */
        stream1.on("error", (err: NodeJS.ErrnoException): void => {
            stream2.destroy();
            reject(err);
        });
        /* istanbul ignore next */
        stream2.on("error", (err: NodeJS.ErrnoException): void => {
            stream1.destroy();
            reject(err);
        });

        stream1.on("end", (): void => {
            hash1.end();
            done1 = true;
            compare();
        });
        stream2.on("end", (): void => {
            hash2.end();
            done2 = true;
            compare();
        });
        stream1.pipe(hash1);
        stream2.pipe(hash2);
    });
}

/**
 * Compare two files in a hash comparison
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.filesHash(file1, file2,(err, areEqual)=>{
 *  if(areEqual){
 *      console.log("Are equal");
 *  }
 * });
 * ```
 *
 * @param path1 - the path to the first file
 * @param path2 - the path to the second file
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `hash` - the type of hash to use in comparison, default to `sha512`
 * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
 * @param callback - the callback function that will be called after the comparison is done
 * @return {Error|boolean}
 */
export function filesHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    options: internal.CompareOptionsHash | undefined,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
export function filesHash(
    path1: fs.PathLike,
    path2: fs.PathLike,
    callback: (err: NodeJS.ErrnoException, equal: boolean) => void
): void;
/* istanbul ignore next */
export function filesHash(path1: fs.PathLike, path2: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = internal.getOptions(options);
    const cb = util.getCallback(options, callback);
    _filesHash(path1, path2, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Compare two files in a hash comparison
     *
     * ```js
     * import * as fs from "fs-extender"
     * const areEqual = await fs.promises.filesHash(file1, file2);
     * if(areEqual){
     *      console.log("Are equal");
     *  }
     * ```
     *
     * @param path1 - the path to the first file
     * @param path2 - the path to the second file
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * - `hash` - the type of hash to use in comparison, default to `sha512`
     * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
     * @return {Promise<boolean>}
     */
    export async function filesHash(
        path1: fs.PathLike,
        path2: fs.PathLike,
        options?: internal.CompareOptionsHash
    ): Promise<boolean> {
        const opt = internal.getOptions(options);
        return _filesHash(path1, path2, opt);
    }
    /**
     * Compare two files in a byte-to-byte comparison
     *
     * ```js
     * import * as fs from "fs-extender"
     * const areEqual = await fs.promises.filesByte(file1, file2);
     * if(areEqual){
     *      console.log("Are equal");
     *  }
     * ```
     *
     * @param path1 - the path to the first file
     * @param path2 - the path to the second file
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * - `chunkSize` - Size to use when comparing files, default is `8192`
     * @return {Promise<boolean>}
     */
    export async function filesByte(
        path1: fs.PathLike,
        path2: fs.PathLike,
        options?: internal.CompareOptionsByte
    ): Promise<boolean> {
        const opt = internal.getOptions(options);
        return _filesByte(path1, path2, opt);
    }
}

/** @internal */
/* istanbul ignore next */
function statCompareSync(file1: fs.PathLike, file2: fs.PathLike, options: internal._CompareOptionsInternal): boolean {
    const statSync = options.dereference ? fs.statSync : fs.lstatSync;
    const stat1 = statSync(file1);
    const stat2 = statSync(file2);
    if (!stat1.isFile()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${file1}' is not a directory`);
        }
    }
    if (!stat2.isFile()) {
        if (options.ignoreError) {
            return false;
        } else {
            throw new Error(`'${file2}' is not a directory`);
        }
    }
    return stat1.size === stat2.size;
}

/** @internal */
function compareFilesSync(file1: fs.PathLike, file2: fs.PathLike, options: internal._CompareOptionsInternal): boolean {
    const fd1 = fs.openSync(file1, "r");
    const fd2 = fs.openSync(file2, "r");

    try {
        let done1, done2, data1, data2;
        done1 = false;
        done2 = false;
        data1 = Buffer.alloc(0);
        data2 = Buffer.alloc(0);
        while (!done1 || !done2) {
            const buf1 = Buffer.alloc(options.chunkSize);
            const buf2 = Buffer.alloc(options.chunkSize);
            buf1.fill(0);
            buf2.fill(0);
            const bytesRead1 = fs.readSync(fd1, buf1, 0, options.chunkSize, null);
            if (bytesRead1) {
                data1 = Buffer.concat([data1, buf1]);
            }
            const bytesRead2 = fs.readSync(fd2, buf2, 0, options.chunkSize, null);
            if (bytesRead2) {
                data2 = Buffer.concat([data2, buf2]);
            }
            done1 = bytesRead1 === 0;
            done2 = bytesRead2 === 0;
            if (data1.length >= options.chunkSize && data2.length >= options.chunkSize) {
                const b1 = data1.slice(0, options.chunkSize);
                const b2 = data2.slice(0, options.chunkSize);
                if (!b1.equals(b2)) {
                    return false;
                }
                data1 = data1.slice(options.chunkSize);
                data2 = data2.slice(options.chunkSize);
            }
        }
        return true;
    } catch (err) {
        /* istanbul ignore next */
        throw err;
    } finally {
        fs.closeSync(fd1);
        fs.closeSync(fd2);
    }
}

/**
 * Compare two files in a byte-to-byte comparison
 *
 * ```js
 * import * as fs from "fs-extender"
 * const areEqual = fs.filesByteSync(file1, file2);
 * if(areEqual){
 *      console.log("Are equal");
 *  }
 * ```
 *
 * @param path1 - the path to the first file
 * @param path2 - the path to the second file
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `chunkSize` - Size to use when comparing files, default is `8192`
 * @return {Error|Array}
 */
export function filesByteSync(path1: fs.PathLike, path2: fs.PathLike, options?: internal.CompareOptionsByte): boolean {
    const opt = internal.getOptions(options);

    const file1 = NodePath.resolve(path1);
    const file2 = NodePath.resolve(path2);

    if (!statCompareSync(file1, file2, opt)) {
        return false;
    }
    return compareFilesSync(file1, file2, opt);
}

/**
 * Compare two files in a hash comparison
 *
 * ```js
 * import * as fs from "fs-extender"
 * const areEqual = fs.filesHashSync(file1, file2);
 * if(areEqual){
 *      console.log("Are equal");
 *  }
 * ```
 *
 * @param path1 - the path to the first file
 * @param path2 - the path to the second file
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * - `hash` - the type of hash to use in comparison, default to `sha512`
 * - `encoding` - the type of hash encoding used to compare the files, default to `hex`
 * @return {Error|Array}
 */
export function filesHashSync(path1: fs.PathLike, path2: fs.PathLike, options?: internal.CompareOptionsHash): boolean {
    const opt = internal.getOptions(options);

    const file1 = NodePath.resolve(path1);
    const file2 = NodePath.resolve(path2);

    if (!statCompareSync(file1, file2, opt)) {
        return false;
    }

    const hash1 = NodeCrypto.createHash(opt.hash);
    const hash2 = NodeCrypto.createHash(opt.hash);
    hash1.setEncoding(opt.encoding);
    hash2.setEncoding(opt.encoding);
    const fd1 = fs.openSync(file1, "r");
    const fd2 = fs.openSync(file2, "r");

    try {
        let done1, done2;
        done1 = false;
        done2 = false;
        while (!done1 || !done2) {
            const buf1 = Buffer.alloc(opt.chunkSize);
            const buf2 = Buffer.alloc(opt.chunkSize);
            buf1.fill(0);
            buf2.fill(0);
            const bytesRead1 = fs.readSync(fd1, buf1, 0, opt.chunkSize, null);
            if (bytesRead1) {
                hash1.update(buf1);
            }
            const bytesRead2 = fs.readSync(fd2, buf2, 0, opt.chunkSize, null);
            if (bytesRead2) {
                hash2.update(buf2);
            }
            done1 = bytesRead1 === 0;
            done2 = bytesRead2 === 0;
        }
        hash1.end();
        hash2.end();
        return hash1.read() === hash2.read();
    } catch (err) {
        /* istanbul ignore next */
        throw err;
    } finally {
        fs.closeSync(fd1);
        fs.closeSync(fd2);
    }
}
