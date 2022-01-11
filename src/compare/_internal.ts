import { Type } from "@n3okill/utils";
import * as util from "../util.js";

export type CompareOptionsByte = {
    /** Dereference links, default is false */
    dereference?: boolean;
    /** Size to use when comparing files, default is 8192 */
    chunkSize?: number;
    /** If true will ignore error's when trying to compare a path that is not a directory, default: false */
    ignoreError?: boolean;
};

export type CompareOptionsHash = {
    /** Type of hash to use for compare, default is 'sha512' */
    hash?: string;
    /** Type of encoding to use for compare, default is 'hex' */
    encoding?: BufferEncoding;
    /** Dereference links, default is false */
    dereference?: boolean;
    /** If true will ignore error's when trying to compare a path that is not a directory, default: false */
    ignoreError?: boolean;
};

/** @internal */
export type _CompareOptionsInternal = {
    /** Dereference links, default is false */
    dereference: boolean;
    /** Type of hash to use for compare, default is 'sha512' */
    hash: string;
    /** Type of encoding to use for compare, default is 'hex' */
    encoding: BufferEncoding;
    /** Size to use when comparing files, default is 8192 */
    chunkSize: number;
    /** If true will ignore error's when trying to compare a path that is not a directory, default: false */
    ignoreError: boolean;
};

/** @internal */
export function getOptions(opt: unknown): _CompareOptionsInternal {
    return {
        dereference: util.getObjectOption(opt, "dereference", false),
        hash: util.getObjectOption(opt, "hash", "sha512"),
        encoding: util.getObjectOption(opt, "encoding", "hex"),
        chunkSize: util.getObjectOption(opt, "chunckSize", 8192),
        ignoreError: util.getObjectOption(opt, "ignoreError", false),
    };
}

/** @internal */
/* istanbul ignore next */
export function makeCallback(cb: unknown): CallableFunction {
    if (Type.isFunction(cb)) {
        return cb as CallableFunction;
    }
    throw new TypeError("'callback' must be a function.");
}
