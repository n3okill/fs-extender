import NodePath from "path-extender";
import * as fs from "../../patch";
import { ensureDirSync } from "./dir";
import * as util from "../util";
import { Type } from "@n3okill/utils";
import * as NodeFs from "fs";

/** @internal */
/* istanbul ignore next */
function ensureWriteStream(path: fs.PathLike, options: util._EnsureOptionsFileInternal): NodeFs.WriteStream {
    return fs.createWriteStream(path, options.streamOptions);
}

/** @internal */
function ensureWriteFile(file: fs.PathLike, options: util._EnsureOptionsFileInternal): fs.PathLike {
    const opt: fs.WriteFileOptions = {
        encoding: options.encoding,
        flag: options.flag,
    };
    if (options.mode) {
        opt.mode = options.mode;
    }
    fs.writeFileSync(file, Type.isUndefined(options.data) ? "" : (options.data as never), opt);
    return file;
}

/** @internal */
/* istanbul ignore next */
function createFileSync(file: fs.PathLike, options: util._EnsureOptionsFileInternal): NodeFs.WriteStream | fs.PathLike {
    const dirOpt: util.EnsureOptionsDir = {};
    if (!Type.isNullOrUndefined(options.dirMode)) {
        dirOpt.mode = options.dirMode;
    }
    ensureDirSync(NodePath.dirname(file), dirOpt);
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
 * fs.ensureFileSync(path);
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
 * @return path: fs.PathLike | stream: fs.WriteStrem`
 */
export function ensureFileSync(
    path: fs.PathLike,
    options?: (util.EnsureOptionsFile & { stream?: false }) | undefined
): fs.PathLike;
export function ensureFileSync(
    path: fs.PathLike,
    options: util.EnsureOptionsFile & { stream: true }
): NodeFs.WriteStream;
export function ensureFileSync(path: fs.PathLike, options?: util.EnsureOptionsFile): NodeFs.WriteStream | fs.PathLike {
    const opt = util.getOptionsFile(options) as util._EnsureOptionsFileInternal;

    let stat;
    try {
        stat = fs.statSync(path);
    } catch (err) {
        return createFileSync(path, opt);
    }
    /* istanbul ignore next */
    if (stat.isFile()) {
        if (opt.mode && (stat.mode & 0o777) !== opt.mode) {
            fs.chmodSync(path, opt.mode);
        }
        if (opt.stream) {
            return ensureWriteStream(path, opt);
        } else if (opt.flag.startsWith("a")) {
            return ensureWriteFile(path, opt);
        }
        return path;
    } else {
        const e: NodeJS.ErrnoException = new Error(`'${path}' already exists and is not a file.`);
        e.code = "EEXIST";
        throw e;
    }
}
