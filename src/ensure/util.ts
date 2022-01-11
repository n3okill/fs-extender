import * as fs from "../patch/patch.js";
import { Type } from "@n3okill/utils";
import * as util from "../util.js";
import * as NodeFs from "fs";

/** Options for ensureDir and ensureDirSync */
export type EnsureOptionsDir = {
    /** Mode defined for directory, default is 777 */
    mode?: fs.Mode;
};

export type _EnsureOptionsDirInternal = Required<EnsureOptionsDir>;

/** Options for stream creation when stream is true */
export type EnsureOptionsFileStreamOptions = {
    flags?: string | undefined;
    encoding?: BufferEncoding | undefined;
    fd?: number | NodeFs.promises.FileHandle | undefined;
    mode?: number | undefined;
    autoClose?: boolean | undefined;
    /**
     * @default false
     */
    emitClose?: boolean | undefined;
    start?: number | undefined;
    highWaterMark?: number | undefined;
};

/** Options for ensureFile and ensureFileSync */
export type EnsureOptionsFile = EnsureOptionsDir & {
    /** Data to be written in the file */
    data?: string | NodeJS.ArrayBufferView;
    /** Encoding to be used when data is string*/
    encoding?: BufferEncoding | null | undefined;
    /** Mode defined for the directory where file will be created */
    dirMode?: fs.Mode;
    /** File to be created must return a stream to the user, default is false */
    stream?: boolean;
    /** Options for the stream creation when stream is true */
    streamOptions?: BufferEncoding | EnsureOptionsFileStreamOptions;
    flag?: string;
};
export type _EnsureOptionsFileInternal = Omit<EnsureOptionsFile, "flag" | "stream"> &
    Required<Pick<EnsureOptionsFile, "flag" | "stream">>;

/** options for ensureSymlink and ensureSymlinkSync */
export type EnsureOptionsSymlink = /*EnsureOptions &*/ {
    type?: EnsureOptionsSymlinkType;
};
export type _EnsureOptionsSymlinkInternal = EnsureOptionsSymlink;

/** Type options for ensureSymlink and ensureSymlinkSync */
export type EnsureOptionsSymlinkType = "file" | "dir" | "junction";

/** @hidden */
export type EnsureSymlinkPathsType = {
    toCwd: fs.PathLike;
    toDst: fs.PathLike;
};

/** @hidden */
export function getOptionsDir(opt?: unknown): _EnsureOptionsDirInternal {
    let mode;
    /* istanbul ignore next */
    if (Type.isNumeric(opt)) {
        mode = opt;
    } else if (opt && "mode" in (opt as EnsureOptionsDir)) {
        mode = (opt as EnsureOptionsDir).mode;
    } else {
        mode = 0o777;
    }

    const options = {} as _EnsureOptionsDirInternal;
    /* istanbul ignore next */
    if (Type.isNumeric(mode)) {
        if (Type.isString(mode)) {
            options.mode = parseInt(mode as string, 8);
        } else {
            options.mode = mode as number;
        }
    }
    return options;
}

/** @hidden */
export function getOptionsFile(opt?: unknown): _EnsureOptionsFileInternal {
    const options = getOptionsDir(opt) as _EnsureOptionsFileInternal;
    options.stream = util.getObjectOption(opt, "stream", false);
    options.flag = util.getObjectOption(opt, "flag", "wx");
    const optAux = (opt as EnsureOptionsFile) || {};

    /* istanbul ignore next */
    if ("dirMode" in optAux) {
        if (Type.isNumeric(optAux.dirMode)) {
            if (Type.isString(optAux.dirMode)) {
                options.dirMode = parseInt(optAux.dirMode as string, 8);
            } else {
                options.dirMode = optAux.dirMode as number;
            }
        }
    }
    if ("data" in optAux) {
        options.data = optAux.data;
    }
    /* istanbul ignore next */
    if ("streamOptions" in optAux) {
        options.streamOptions = optAux.streamOptions;
    }
    if ("encoding" in optAux) {
        options.encoding = optAux.encoding;
    }
    return options;
}

/* istanbul ignore next */
export function getSymlinkOptions(opt: unknown = {}): _EnsureOptionsSymlinkInternal {
    const options = {} as _EnsureOptionsSymlinkInternal;
    if ("type" in (opt as Record<string, unknown>)) {
        options.type = (opt as Record<string, unknown>)["type"] as EnsureOptionsSymlinkType;
    }
    return options;
}

export const getCallback = util.getCallback;

export function areIdentical(srcStat: fs.Stats | fs.BigIntStats, dstStat: fs.Stats | fs.BigIntStats): boolean {
    return (
        dstStat.ino !== undefined &&
        dstStat.dev !== undefined &&
        dstStat.ino === srcStat.ino &&
        dstStat.dev === srcStat.dev
    );
}
