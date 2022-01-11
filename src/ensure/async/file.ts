import NodePath from "path-extender";
import * as fs from "../../patch/patch.js";
import * as ensureDir from "./dir.js";
import * as util from "../util.js";
import { Type } from "@n3okill/utils";

/** @internal */
/* istanbul ignore next */
async function ensureWriteStream(path: fs.PathLike, options: util._EnsureOptionsFileInternal): Promise<fs.WriteStream> {
    return fs.createWriteStream(path, options.streamOptions);
}

/** @internal */
async function ensureWriteFile(file: fs.PathLike, options: util._EnsureOptionsFileInternal): Promise<fs.PathLike> {
    const opt: fs.WriteFileOptions = {
        encoding: options.encoding,
        flag: options.flag,
    };
    if (options.mode) {
        opt.mode = options.mode;
    }
    await fs.promises.writeFile(file, Type.isUndefined(options.data) ? "" : (options.data as never), opt);
    return file;
}

/** @internal */
/* istanbul ignore next */
async function createFile(
    file: fs.PathLike,
    options: util._EnsureOptionsFileInternal
): Promise<fs.WriteStream | fs.PathLike> {
    const dirOpt: util.EnsureOptionsDir = {
        /*fs: options.fs*/
    };
    if (Type.isNumeric(options.dirMode)) {
        dirOpt.mode = options.dirMode;
    }
    await ensureDir.promises.ensureDir(NodePath.dirname(file), dirOpt);
    if (options.stream) {
        return ensureWriteStream(file, options);
    } else {
        return ensureWriteFile(file, options);
    }
}

/**
 * ensureFile - ensures file existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureFile(path,(err)=>{
 *  if(!err) {
 *      console.log(`${path} is ensured in the file system.`);
 *  }
 * });
 * ```
 *
 * @param path - the path to the file
 * @param options  - used to create the file or modify it, options can be
 * - `data`: {string | NodeJS.ArrayBufferView} - Data to be written in the file, default: `undefined`
 * - `encoding` - Encoding to be used when data is string, default: `utf8`
 * - `dirMode` - Mode defined for the directory where file will be created, default: `undefined`,
 *      if directory exists mode will not be altered, if diretory is created then the default system mode will be used
 * - `stream` - File to be created must return a stream to the user, default: `false`
 * - `streamOptions` - If stream option is set to true this option will hold the stream properties:
 * -- `flags: string | undefined`
 * -- `encoding: BufferEncoding | undefined`
 * -- `fd: number | NodeFs.promises.FileHandle | undefined`
 * -- `mode: number | undefined`
 * -- `autoClose: boolean | undefined`
 * -- `emitClose: boolean` - default: false
 * -- `start: number | undefined`
 * -- `highWaterMark: number | undefined`
 * - `flag` - flag used to create the file, default: `wx`
 * - `mode` - mode used to set the file mode, default: 0o777
 * @param callback - `(err: Error |null, (path: fs.PathLike | stream: fs.WriteStrem))`
 */
export function ensureFile(
    path: fs.PathLike,
    options: (util.EnsureOptionsFile & { stream?: false }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, path?: fs.PathLike) => void
): void;
export function ensureFile(
    path: fs.PathLike,
    options: (util.EnsureOptionsFile & { stream: true }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, stream?: fs.WriteStream) => void
): void;
export function ensureFile(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, path?: fs.PathLike) => void): void;
export function ensureFile(path: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = util.getOptionsFile(options);
    const cb = util.getCallback(options, callback);
    _ensureFile(path, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/**@internal */
/* istanbul ignore next */
async function _ensureFile(
    path: fs.PathLike,
    options: util._EnsureOptionsFileInternal
): Promise<fs.PathLike | fs.WriteStream> {
    let stat;
    try {
        stat = await fs.promises.stat(path);
    } catch (err) {
        return createFile(path, options);
    }

    if (stat.isFile()) {
        if (options.mode && (stat.mode & 0o777) !== options.mode) {
            await fs.promises.chmod(path, options.mode);
        }
        if (options.stream) {
            return ensureWriteStream(path, options);
        } else if (options.flag.startsWith("a")) {
            return ensureWriteFile(path, options);
        }
        return path;
    } else {
        const e: NodeJS.ErrnoException = new Error(`'${path}' already exists and is not a file.`);
        e.code = "EEXIST";
        throw e;
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * ensureFile - ensures file existence on file system
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.ensureFile(path);
     * console.log(`${path} is ensured in the file system.`);
     * ```
     *
     * @param path - the path to the file
     * @param options  - used to create the file or modify it, options can be
     * - `data`: {string | NodeJS.ArrayBufferView} - Data to be written in the file, default: `undefined`
     * - `encoding` - Encoding to be used when data is string, default: `utf8`
     * - `dirMode` - Mode defined for the directory where file will be created, default: `undefined`,
     *      if directory exists mode will not be altered, if diretory is created then the default system mode will be used
     * - `stream` - File to be created must return a stream to the user, default: `false`
     * - `streamOptions` - If stream option is set to true this option will hold the stream properties:
     * -- `flags: string | undefined`
     * -- `encoding: BufferEncoding | undefined`
     * -- `fd: number | NodeFs.promises.FileHandle | undefined`
     * -- `mode: number | undefined`
     * -- `autoClose: boolean | undefined`
     * -- `emitClose: boolean` - default: false
     * -- `start: number | undefined`
     * -- `highWaterMark: number | undefined`
     * - `flag` - flag used to create the file, default: `wx`
     * - `mode` - mode used to set the file mode, default: 0o777
     * @return Promise<path: fs.PathLike | stream: fs.WriteStrem>`
     */
    export async function ensureFile(
        path: fs.PathLike,
        options?: (util.EnsureOptionsFile & { stream?: false }) | undefined
    ): Promise<fs.PathLike>;
    export async function ensureFile(
        path: fs.PathLike,
        options: (util.EnsureOptionsFile & { stream: true }) | undefined
    ): Promise<fs.WriteStream>;
    export async function ensureFile(path: fs.PathLike, options?: unknown): Promise<fs.PathLike | fs.WriteStream> {
        const opt = util.getOptionsFile(options);
        return _ensureFile(path, opt);
    }
}
