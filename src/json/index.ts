import * as fs from "../patch/patch.js";
import * as util from "../util.js";
import * as ensure from "../ensure/index.js";
import { Type } from "@n3okill/utils";
import * as readline from "readline";

export type ReplacerType =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((key: string, value: any) => any) | Array<string | number> | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReviverType = (key: string, value: any) => any;

export type WriteJsonOptions = {
    EOL?: string;
    finalEOL?: boolean;
    /**
     * A function that transforms the results or
     * an array of strings and numbers that acts as an approved list for selecting the
     * object properties that will be stringified.
     */
    replacer?: ReplacerType;
    /**
     * Adds indentation, white space, and line break
     * characters to the return-value JSON text to make it easier to read.
     */
    spaces?: number | string | null;
    encoding?: BufferEncoding | null | undefined;
    mode?: number | string;
    flag?: string;
};

/** @internal */
type _WriteJsonOptionsInternal = Required<WriteJsonOptions>;

export type ReadJsonOptions = ReadJsonLineOptions & {
    flag?: string;
};

export type ReadJsonLineOptions = {
    encoding?: BufferEncoding | undefined;
    throws?: boolean;
    reviver?: ReviverType | undefined;
};

/** @internal */
type _ReadJsonLinesOptionsInternal = Required<Omit<ReadJsonLineOptions, "reviver">> & {
    reviver?: ReviverType;
};

/** @internal */
type _ReadJsonOptionsInternal = _ReadJsonLinesOptionsInternal & {
    flag: string;
};

/** @internal */
function getWriteOptions(opt: unknown = {}): _WriteJsonOptionsInternal {
    return {
        EOL: util.getObjectOption(opt, "EOL", "\n"),
        finalEOL: util.getObjectOption(opt, "finalEOL", true),
        replacer: util.getObjectOption(opt, "replacer", null),
        spaces: util.getObjectOption(opt, "spaces", null),
        encoding: util.getObjectOption(opt, "encoding", "utf8"),
        mode: util.getObjectOption(opt, "mode", 0o666),
        flag: util.getObjectOption(opt, "flag", "wx"),
    };
}

/** @internal */
function getReadOptions(opt: unknown = {}): _ReadJsonOptionsInternal {
    const options = getReadLineOptions(opt) as _ReadJsonOptionsInternal;
    options.flag = util.getObjectOption(opt, "flag", "r");
    return options;
}

/** @internal */
function getReadLineOptions(opt: unknown = {}): _ReadJsonLinesOptionsInternal {
    return {
        encoding: util.getObjectOption(opt, "encoding", "utf8"),
        throws: util.getObjectOption(opt, "throws", true),
        reviver: util.getObjectOption(opt, "reviver", undefined),
    };
}

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.writeJsonFile(path,{name:'Jonh Smith', age:1001},(err)=>{
 *  if(!err) {
 *      console.log(`File writed with success`);
 *  }
 * });
 * ```
 *
 * @param path - fs.PathLike
 * @param obj - object to write to file as json string
 * @param options - options
 *  - `EOL` - End Of Line character default: `\n`
 *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
 *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
 *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
 *  - `encoding` - The encoding used to write the file, default: `utf8`
 *  - `mode` - The mode used to for the file, default: `0o666`
 *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
 * @param callback - (err: NodeJs.ErroNoException | null, path: fs.PathLike)
 */
export function writeJsonFile<T>(
    path: fs.PathLike,
    obj: T,
    options: WriteJsonOptions,
    callback: (err: NodeJS.ErrnoException | null, path: fs.PathLike) => void
): void;
export function writeJsonFile<T>(
    path: fs.PathLike,
    obj: T,
    callback: (err: NodeJS.ErrnoException | null, path: fs.PathLike) => void
): void;
export function writeJsonFile<T>(path: fs.PathLike, obj: T, options: unknown, callback?: unknown): void {
    const opt = getWriteOptions(options);
    const cb = util.getCallback(options, callback);
    _writeJsonFile(path, obj, opt)
        .then((p) => cb(null, p))
        .catch((err) => cb(err));
}

/** @internal */
async function _writeJsonFile<T>(path: fs.PathLike, obj: T, options: _WriteJsonOptionsInternal): Promise<fs.PathLike> {
    const str = stringify(obj, options);
    await fs.promises.writeFile(path, str, {
        encoding: options.encoding,
        mode: options.mode,
        flag: options.flag,
    });
    return path;
}

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it
 * to a file making sure the file is created even if the path doesn't exist
 * This works as a mix between @see[writeJsonFile] and @see[ensureFile]
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureJsonFile(path,{name:'Jonh Smith', age:1001},(err)=>{
 *  if(!err) {
 *      console.log(`File writed with success`);
 *  }
 * });
 * ```
 *
 * @param path - fs.PathLike
 * @param obj - object to write to file as json string
 * @param options - options
 *  - `EOL` - End Of Line character default: `\n`
 *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
 *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
 *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
 *  - `encoding` - The encoding used to write the file, default: `utf8`
 *  - `mode` - The mode used to for the file, default: `0o666`
 *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
 * @param callback - (err: NodeJs.ErroNoException | null, path: fs.PathLike)
 */
export function ensureJsonFile(
    path: fs.PathLike,
    obj: unknown,
    options: WriteJsonOptions,
    callback: (err: NodeJS.ErrnoException | null, path: fs.PathLike) => void
): void;
export function ensureJsonFile(
    path: fs.PathLike,
    obj: unknown,
    callback: (err: NodeJS.ErrnoException | null, path: fs.PathLike) => void
): void;
export function ensureJsonFile(path: fs.PathLike, obj: unknown, options: unknown, callback?: unknown): void {
    const opt = getWriteOptions(options);
    const cb = util.getCallback(options, callback);
    _ensureJsonFile(path, obj, opt)
        .then((p) => cb(null, p))
        .catch((err) => cb(err));
}

/** @internal */
async function _ensureJsonFile(
    path: fs.PathLike,
    obj: unknown,
    options: _WriteJsonOptionsInternal
): Promise<fs.PathLike> {
    const str = stringify(obj, options);
    return ensure.promises.ensureFile(path, {
        data: str,
        encoding: options.encoding,
        mode: options.mode,
        flag: options.flag,
    });
}

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.writeJsonFileSync(path,{name:'Jonh Smith', age:1001});
 * console.log(`File writed with success`);
 * ```
 *
 * @param path - fs.PathLike
 * @param obj - object to write to file as json string
 * @param options - options
 *  - `EOL` - End Of Line character default: `\n`
 *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
 *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
 *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
 *  - `encoding` - The encoding used to write the file, default: `utf8`
 *  - `mode` - The mode used to for the file, default: `0o666`
 *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
 * @return `fs.PathLike`
 */
export function writeJsonFileSync(path: fs.PathLike, obj: unknown, options?: WriteJsonOptions): fs.PathLike {
    const opt = getWriteOptions(options);
    const str = stringify(obj, opt);
    fs.writeFileSync(path, str, opt);
    return path;
}

/**
 * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it
 * to a file making sure the file is created even if the path doesn't exist
 * This works as a mix between @see[writeJsonFileSync] and @see[ensureFileSync]
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureJsonFileSync(path,{name:'Jonh Smith', age:1001});
 * console.log(`File writed with success`);
 * ```
 *
 * @param path - fs.PathLike
 * @param obj - object to write to file as json string
 * @param options - options
 *  - `EOL` - End Of Line character default: `\n`
 *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
 *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
 *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
 *  - `encoding` - The encoding used to write the file, default: `utf8`
 *  - `mode` - The mode used to for the file, default: `0o666`
 *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
 * @return `fs.PathLike`
 */
export function ensureJsonFileSync(path: fs.PathLike, obj: unknown, options?: WriteJsonOptions): fs.PathLike {
    const opt = getWriteOptions(options);
    const str = stringify(obj, opt);
    return ensure.ensureFileSync(path, {
        data: str,
        encoding: opt.encoding,
        mode: opt.mode,
        flag: opt.flag,
    });
}

/** @internal */
function stringify<T>(obj: T, options: _WriteJsonOptionsInternal): string {
    const EOF = options.finalEOL ? options.EOL : "";
    const str = JSON.stringify(obj, options.replacer as never, options.spaces as never);
    return str.replace(/\n/g, options.EOL) + EOF;
}

/**
 * Read json file and transform's it into an object
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.readJsonFile(path,(err, obj)=>{
 *  if(!err) {
 *      console.log(`File read with success. Object: ${obj}`);
 *  }
 * });
 * ```
 *
 * @param path - fs.pathLike
 * @param options - options
 * - `flag` - flag used to open the file, default: `r`
 * - `encoding` - `BufferEncoding` used to read the file, default: `utf8`
 * - `throws` - should throw if an error occur, default: `true`
 * - `reviver` Reviver function used to parse the json string, default: `undefined`
 * @param callback - `(err: NodeJs.ErrNoException | null, res: any)`
 */
export function readJsonFile<T>(
    path: fs.PathLike,
    options: ReadJsonOptions,
    callback: (err: NodeJS.ErrnoException | null, res: T) => void
): void;
export function readJsonFile<T>(path: fs.PathLike, callback: (err: NodeJS.ErrnoException | null, res: T) => void): void;
export function readJsonFile(path: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = getReadOptions(options);
    const cb = util.getCallback(options, callback);
    _readJsonFile(path, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

/** @internal */
async function _readJsonFile<T>(path: fs.PathLike, options: _ReadJsonOptionsInternal): Promise<T> {
    try {
        let content = await fs.promises.readFile(path, {
            encoding: options.encoding,
            flag: options.flag,
        });
        content = stripBom(content);
        return JSON.parse(content, options.reviver);
    } catch (err) {
        if (options.throws) {
            (err as NodeJS.ErrnoException).message = `${path}: ${(err as NodeJS.ErrnoException).message}`;
            throw err;
        }
        return undefined as unknown as T;
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.writeJsonFile(path,{name:'Jonh Smith', age:1001});
     * console.log(`File writed with success`);
     * ```
     *
     * @param path - fs.PathLike
     * @param obj - object to write to file as json string
     * @param options - options
     *  - `EOL` - End Of Line character default: `\n`
     *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
     *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
     *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
     *  - `encoding` - The encoding used to write the file, default: `utf8`
     *  - `mode` - The mode used to for the file, default: `0o666`
     *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
     * @return `Promise<fs.PathLike>`
     */
    export async function writeJsonFile(
        path: fs.PathLike,
        obj: unknown,
        options?: WriteJsonOptions
    ): Promise<fs.PathLike> {
        const opt = getWriteOptions(options);
        return _writeJsonFile(path, obj, opt);
    }
    /**
     * Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it
     * to a file making sure the file is created even if the path doesn't exist
     * This works as a mix between @see[writeJsonFile] and @see[ensureFile]
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.ensureJsonFile(path,{name:'Jonh Smith', age:1001});
     * console.log(`File writed with success`);
     * ```
     *
     * @param path - fs.PathLike
     * @param obj - object to write to file as json string
     * @param options - options
     *  - `EOL` - End Of Line character default: `\n`
     *  - `finalEOL` - Use EOL character at the end of the file, default: `true`
     *  - `replacer` - The replacer function to use when transforming object to json, default: `null`, no replacer used
     *  - `spaces` - The number of spaces to use as identation, default: `null`, o spaces used
     *  - `encoding` - The encoding used to write the file, default: `utf8`
     *  - `mode` - The mode used to for the file, default: `0o666`
     *  - `flag` - Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists
     * @return `Promise<fs.PathLike>`
     */
    export async function ensureJsonFile(
        path: fs.PathLike,
        obj: unknown,
        options?: WriteJsonOptions
    ): Promise<fs.PathLike> {
        const opt = getWriteOptions(options);
        return _ensureJsonFile(path, obj, opt);
    }
    /**
     * Read json file and transform's it into an object
     *
     * ```js
     * import * as fs from "fs-extender"
     * const obj = await fs.promises.readJsonFile(path);
     * console.log(`File read with success. Object: ${obj}`);
     * ```
     *
     * @param path - fs.pathLike
     * @param options - options
     * - `flag` - flag used to open the file, default: `r`
     * - `encoding` - `BufferEncoding` used to read the file, default: `utf8`
     * - `throws` - should throw if an error occur, default: `true`
     * - `reviver` Reviver function used to parse the json string, default: `undefined`
     * @return `Promise<any>`
     */
    export async function readJsonFile<T>(path: fs.PathLike, options?: ReadJsonOptions): Promise<T> {
        const opt = getReadOptions(options);
        return _readJsonFile(path, opt);
    }
    /**
     * Read json file and transform's it into an object
     *
     * ```js
     * import * as fs from "fs-extender"
     * const lines=[];
     * await fs.promises.readJsonLines(path,(obj)=>{
     *  lines.push(obj);
     *  return true;
     * });
     * console.log(`File read with success. Lines: ${lines.length}`);
     * ```
     *
     * @param path - fs.pathLike
     * @param options - options
     * - `flag` - flag used to open the file, default: `r`
     * - `encoding` - `BufferEncoding` used to read the file, default: `utf8`
     * - `throws` - should throw if an error occur, default: `true`
     * - `reviver` Reviver function used to parse the json string, default: `undefined`
     * @param fn - function executed for each line readed: `(obj: any) => boolean | Promise<boolean>`
     *              if the function return false the execution will be stopped.
     * @return `Promise<any>`
     */
    export async function readJsonLines(
        path: fs.PathLike,
        options: ReadJsonLineOptions,
        fn: ReadJsonLinesFunction
    ): Promise<void>;
    export async function readJsonLines(path: fs.PathLike, fn: ReadJsonLinesFunction): Promise<void>;
    export async function readJsonLines(path: fs.PathLike, options: unknown, fn?: unknown): Promise<void> {
        let caller = fn as ReadJsonLinesFunction,
            opt: _ReadJsonLinesOptionsInternal;
        if (Type.isFunction(options)) {
            caller = options as ReadJsonLinesFunction;
            opt = getReadLineOptions();
        } else {
            opt = getReadLineOptions(options);
        }
        return _readJsonLines(path, opt, caller);
    }
}

/**
 * Read json file and transform's it into an object
 *
 * ```js
 * import * as fs from "fs-extender"
 * const obj = fs.readJsonFileSync(path);
 * console.log(`File read with success. Object: ${obj}`);
 * ```
 *
 * @param path - fs.pathLike
 * @param options - options
 * - `flag` - flag used to open the file, default: `r`
 * - `encoding` - `BufferEncoding` used to read the file, default: `utf8`
 * - `throws` - should throw if an error occur, default: `true`
 * - `reviver` Reviver function used to parse the json string, default: `undefined`
 * @return `any`
 */
export function readJsonFileSync<T>(path: fs.PathLike, options?: ReadJsonOptions): T {
    const opt = getReadOptions(options);
    try {
        let content = fs.readFileSync(path, {
            encoding: opt.encoding,
            flag: opt.flag,
        });
        content = stripBom(content);
        return JSON.parse(content, opt.reviver);
    } catch (err) {
        if (opt.throws) {
            (err as NodeJS.ErrnoException).message = `${path}: ${(err as NodeJS.ErrnoException).message}`;
            throw err;
        }
        return undefined as unknown as T;
    }
}

/** @internal */
function stripBom(content: string | Buffer): string {
    if (Buffer.isBuffer(content)) {
        return content.toString("utf8").replace(/^\uFEFF/, "");
    }
    return content.replace(/^\uFEFF/, "");
}

/**
 * return `boolean`, if false will stop execution
 */
export type ReadJsonLinesFunction = <T>(obj?: T) => boolean | Promise<boolean>;

/**
 * Read json file and transform's it into an object
 *
 * ```js
 * import * as fs from "fs-extender"
 * const lines=[];
 * fs.readJsonLines(path,(obj)=>{
 *  lines.push(obj);
 *  return true;
 * },(err)=>{
 *  if(!err) {
 *      console.log(`File read with success. Lines: ${lines.length}`);
 *  }
 * });
 * ```
 *
 * @param path - fs.pathLike
 * @param options - options
 * - `flag` - flag used to open the file, default: `r`
 * - `encoding` - `BufferEncoding` used to read the file, default: `utf8`
 * - `throws` - should throw if an error occur, default: `true`
 * - `reviver` Reviver function used to parse the json string, default: `undefined`
 * @param fn - function executed for each line readed: `(obj: any) => boolean | Promise<boolean>`
 *              if the function return false the execution will be stopped.
 * @param callback - `(err: NodeJs.ErrNoException | null, res: any)`
 */
export function readJsonLines(
    path: fs.PathLike,
    options: ReadJsonLineOptions,
    fn: ReadJsonLinesFunction,
    callback: (err: NodeJS.ErrnoException | null) => void
): void;
export function readJsonLines(
    path: fs.PathLike,
    fn: ReadJsonLinesFunction,
    callback: (err: NodeJS.ErrnoException | null) => void
): void;
export function readJsonLines(path: fs.PathLike, options: unknown, fn: unknown, callback?: unknown): void {
    let caller: ReadJsonLinesFunction, cb: fs.NoParamCallback, opt: _ReadJsonLinesOptionsInternal;
    if (Type.isFunction(options)) {
        caller = options as ReadJsonLinesFunction;
        cb = fn as fs.NoParamCallback;
        opt = getReadLineOptions();
    } else {
        opt = getReadLineOptions(options);
        caller = fn as ReadJsonLinesFunction;
        cb = callback as fs.NoParamCallback;
    }
    _readJsonLines(path, opt, caller)
        .then(() => cb(null))
        .catch((err) => cb(err));
}

/** @internal */
async function _readJsonLines(
    path: fs.PathLike,
    options: _ReadJsonLinesOptionsInternal,
    fn: ReadJsonLinesFunction
): Promise<void> {
    let counter = 0;
    try {
        await fs.promises.stat(path);
    } catch (err) {
        if (options.throws) {
            (err as NodeJS.ErrnoException).message = (err as NodeJS.ErrnoException).message.replace(
                /stat/,
                "readJsonLines"
            );
            throw err;
        }
        return;
    }

    const reader = readline.createInterface({
        input: fs.createReadStream(path, { encoding: options.encoding }),
    });
    for await (const line of reader) {
        try {
            const content = JSON.parse(line, options.reviver);
            if (!(await fn(content))) {
                return;
            }
        } catch (err) {
            if (options.throws) {
                (err as NodeJS.ErrnoException).message = `Line: '${counter++}' ${
                    (err as NodeJS.ErrnoException).message
                }`;
                throw err;
            }
        }
    }
}
