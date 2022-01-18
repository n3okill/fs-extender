import NodePath from "path-extender";
import * as fs from "../patch";
import { StringUtil, Type, BufferUtil /*, NumberUtil*/ } from "@n3okill/utils";
import * as util from "../util";
import { platform } from "os";

/** @internal */
const isWindows = /^win/.test(platform());
/** @internal */
const InvalidWin32Chars = /[<>:"|?*]/;

export type MkdirpOptions = {
    /**
     * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
     * @default 0o777
     */
    mode?: fs.Mode | undefined;
};

/** @internal */
type _MkdirOptionsInternal = Required<MkdirpOptions>;

/** @internal */
/* istanbul ignore next */
function invalidWin32Path(p: string | Buffer): boolean {
    const rootPath = getRootPath(p);
    p = Buffer.isBuffer(p) ? BufferUtil.toString(BufferUtil.multiReplace(p, [rootPath], "")) : p.replace(rootPath, "");
    return InvalidWin32Chars.test(p);
}

/** @internal */
/* istanbul ignore next */
function getRootPath(p: string | Buffer): string {
    const pAux = Buffer.isBuffer(p)
        ? BufferUtil.split(NodePath.normalize(p), NodePath.sep).map((s) => BufferUtil.toString(s))
        : NodePath.normalize(p).split(NodePath.sep);
    return pAux.length > 0 ? pAux[0] : "";
}

/** @internal */
function getPaths(originalPath: fs.PathLike | fs.PathLike[]): Array<string | Buffer> {
    let paths: Array<string | Buffer> = [];

    const path = Array.isArray(originalPath) ? originalPath : [originalPath];
    const isBuffer = path.some((s) => Buffer.isBuffer(s));

    path.forEach((p: fs.PathLike): void => {
        let ps = [util.toStringOrBuffer(isBuffer, p)];
        /* istanbul ignore next */
        if (Buffer.isBuffer(p)) {
            if (BufferUtil.toString(p).indexOf("{") !== -1) {
                ps = BufferUtil.expand(p);
            }
        } else {
            if ((p as string).indexOf("{") !== -1) {
                ps = StringUtil.expand(p as string);
            }
        }
        ps = Array.isArray(ps) ? ps : [ps];
        paths = paths.concat(ps);
    });

    paths = paths.map((p) => NodePath.resolve(p));

    return paths;
}

/** @internal */
function getOptions(opt?: unknown): _MkdirOptionsInternal {
    let mode = util.getObjectOption(opt, "mode", 0o777);
    /* istanbul ignore next */
    if (Type.isNumeric(mode) && Type.isString(mode)) {
        mode = parseInt(mode as unknown as string, 8);
    }
    return {
        mode: mode,
    };
}

/**
 * Asynchronously creates a directory.
 *
 * The callback is given a possible exception and, the last directory paths created,
 * `(err[, path])`.`path` can still be `undefined`, if no directory was
 * created.
 *
 * The optional `options` argument can be an integer specifying `mode` (permission
 * and sticky bits), or an object with a `mode` property and a optional `fs` property.
 *
 * ```js
 * import * as fs from 'fs-extender';
 *
 * // Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
 * fs.mkdirp('/tmp/a/apple', (err) => {
 *   if (err) throw err;
 * });
 * ```
 *
 * ```js
 * fs.mkdirp('/path/{to1,to2}/{dir1,dir2}',(err)=>{
 *  if(err) throw(err);
 * });
 * ```
 * will create the directories:
 *  /path/to1/dir1
 *  /path/to1/dir2
 *  /path/to2/dir1
 *  /path/to2/dir2
 *
 * On Windows, using `fs.mkdirp()` on the root directory even with recursion will
 * result in an error:
 *
 * ```js
 * import { mkdirp } from 'fs-extender';
 *
 * fs.mkdir('/', (err) => {
 *   // => [Error: EPERM: operation not permitted, mkdir 'C:\']
 * });
 * ```
 *
 *
 * See the POSIX [`mkdir(2)`](http://man7.org/linux/man-pages/man2/mkdir.2.html) documentation for more details.
 */
export function mkdirp(
    path: fs.PathLike | fs.PathLike[],
    options: fs.Mode | MkdirpOptions | null | undefined,
    callback: (err: NodeJS.ErrnoException | null, path?: fs.PathLike | fs.PathLike[]) => void
): void;
/**
 * Asynchronous mkdir(2) - create a directory with a mode of `0o777`.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function mkdirp(
    path: fs.PathLike | fs.PathLike[],
    callback: (err: NodeJS.ErrnoException | null, path?: fs.PathLike | fs.PathLike[]) => void
): void;
export function mkdirp(path: fs.PathLike | fs.PathLike[], options: unknown, cb?: unknown): void {
    const opt = getOptions(options);
    const callback = util.getCallback(options, cb);
    const paths = getPaths(path);
    _mkdirpp(paths, opt)
        .then((items) => callback(null, items))
        .catch((err) => callback(err));
}

/** @internal */
async function _mkdirpp(
    paths: Array<string | Buffer>,
    options: _MkdirOptionsInternal
): Promise<string | Buffer | Array<string | Buffer>> {
    const done: Array<string | Buffer> = [];
    const umask = process.umask(0);
    try {
        while (paths.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const p = paths.shift()!;
            /* istanbul ignore next */
            if (isWindows && invalidWin32Path(p)) {
                const e = new Error("Invalid character found in path.");
                (e as NodeJS.ErrnoException).code = "EINVAL";
                throw e;
            }
            const result = await __mkdirpp(p, options);
            done.push(result);
        }
    } finally {
        process.umask(umask);
    }
    return done.length === 1 ? done[0] : done;
}

/** @internal */
async function __mkdirpp(path: string | Buffer, options: _MkdirOptionsInternal): Promise<string | Buffer> {
    const stack: Array<string | Buffer> = [];
    const done: Array<string | Buffer> = [];

    stack.push(path);
    do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const p = stack.pop()!;
        try {
            await fs.promises.mkdir(p, options.mode);
        } catch (er) {
            const err = er as NodeJS.ErrnoException;
            switch (err.code) {
                case "EEXIST":
                    let stat;
                    try {
                        stat = await fs.promises.stat(p);
                    } catch (errStat) {
                        /* istanbul ignore next */
                        throw err;
                    }
                    if (!stat.isDirectory()) {
                        throw err;
                    } else if (!stack.length) {
                        return p;
                    }
                    break;
                case "ENOENT":
                    const parent = NodePath.dirname(p);
                    if (
                        util.equal(parent, p) ||
                        done.indexOf(p) !== -1 ||
                        (Buffer.isBuffer(p) && /\0/.test(BufferUtil.toString(p))) ||
                        (typeof p === "string" && /\0/.test(p))
                    ) {
                        /* istanbul ignore next */
                        throw err;
                    }
                    done.push(p);
                    stack.push(p);
                    stack.push(parent);
                    break;
                default:
                    /* istanbul ignore next */
                    try {
                        const stat = await fs.promises.stat(p);
                        if (stat.isDirectory()) {
                            return p;
                        }
                    } catch (errStat) {}
                    throw err;
            }
        }
    } while (stack.length);

    return path;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Asynchronously creates a directory.
     *
     * Will return all the paths created
     *
     * The optional `options` argument can be an integer specifying `mode` (permission
     * and sticky bits), or an object with a `mode` property and a optional `fs` property.
     *
     * ```js
     * import * as fs from 'fs-extender';
     *
     * // Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
     * fs.promises.mkdirp('/tmp/a/apple');
     * ```
     *
     * ```js
     * fs.promises.mkdirp('/path/{to1,to2}/{dir1,dir2}');
     * ```
     * will create the directories:
     *  /path/to1/dir1
     *  /path/to1/dir2
     *  /path/to2/dir1
     *  /path/to2/dir2
     *
     * On Windows, using `fs.mkdirp()` on the root directory even with recursion will
     * result in an error:
     *
     * ```js
     * fs.promises.mkdir('/');
     *   // => [Error: EPERM: operation not permitted, mkdir 'C:\']
     * ```
     *
     *
     * See the POSIX [`mkdir(2)`](http://man7.org/linux/man-pages/man2/mkdir.2.html) documentation for more details.
     */
    export async function mkdirp(
        path: fs.PathLike | fs.PathLike[],
        options?: MkdirpOptions | fs.Mode | null | undefined
    ): Promise<fs.PathLike | fs.PathLike[]> {
        const opt = getOptions(options);
        const paths = getPaths(path);
        return _mkdirpp(paths, opt);
    }
}

/**
 * Synchronously creates a directory.
 *
 * Will return all the paths created
 *
 * The optional `options` argument can be an integer specifying `mode` (permission
 * and sticky bits), or an object with a `mode` property and a optional `fs` property.
 *
 * ```js
 * import * as fs from 'fs-extender';
 *
 * // Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
 * fs.mkdirpSync('/tmp/a/apple');
 * ```
 *
 * ```js
 * fs.mkdirpSync('/path/{to1,to2}/{dir1,dir2}');
 * ```
 * will create the directories:
 *  /path/to1/dir1
 *  /path/to1/dir2
 *  /path/to2/dir1
 *  /path/to2/dir2
 *
 * On Windows, using `fs.mkdirp()` on the root directory even with recursion will
 * result in an error:
 *
 * ```js
 * fs.mkdirpSync('/');
 *   // => [Error: EPERM: operation not permitted, mkdir 'C:\']
 * ```
 *
 *
 * See the POSIX [`mkdir(2)`](http://man7.org/linux/man-pages/man2/mkdir.2.html) documentation for more details.
 */
export function mkdirpSync(
    path: fs.PathLike | fs.PathLike[],
    options?: MkdirpOptions | fs.Mode | null | undefined
): fs.PathLike | fs.PathLike[] {
    let done = [];
    const opt = getOptions(options);
    const paths = getPaths(path);
    const umask = process.umask(0);
    try {
        while (paths.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const p = paths.shift()!;
            /* istanbul ignore next: tested only in windows */
            if (isWindows && invalidWin32Path(p)) {
                const e = new Error("Invalid character found in path.");
                (e as NodeJS.ErrnoException).code = "EINVAL";
                throw e;
            }
            const result = _mkdirpSync(p, opt);
            done.push(result);
        }
    } finally {
        process.umask(umask);
    }
    done = done.filter((d): boolean => !!d);
    return done.length > 1 ? done : done[0];
}

/** @internal */
function _mkdirpSync(path: string | Buffer, options: _MkdirOptionsInternal): string | Buffer {
    const stack: Array<string | Buffer> = [];
    const done: Array<string | Buffer> = [];

    stack.push(path);
    do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const p = stack.pop()!;
        try {
            fs.mkdirSync(p, options.mode);
        } catch (er) {
            const err = er as NodeJS.ErrnoException;
            if (err.code !== "ENOENT" && err.code !== "EEXIST") {
                try {
                    const stats = fs.statSync(p);
                    /* istanbul ignore next */
                    if (stats.isDirectory()) {
                        return p;
                    }
                    return p;
                } catch (err) {}
                throw err;
            } else if (err.code === "ENOENT") {
                const parent = NodePath.dirname(p);
                if (
                    util.equal(parent, p) ||
                    (Buffer.isBuffer(p) && /\0/.test(BufferUtil.toString(p))) ||
                    (typeof p === "string" && /\0/.test(p))
                ) {
                    /* istanbul ignore next */
                    throw err;
                }
                if (done.indexOf(p) === -1) {
                    done.push(p);
                    stack.push(p);
                    stack.push(parent);
                } else {
                    /* istanbul ignore next */
                    throw err;
                }
            } else if (err.code === "EEXIST") {
                let stat;
                try {
                    stat = fs.statSync(p);
                } catch (errStat) {
                    /* istanbul ignore next */
                    throw err;
                }
                if (stat) {
                    if (!stat.isDirectory()) {
                        throw err;
                    } else if (!stack.length) {
                        return p;
                    }
                }
            }
        }
    } while (stack.length);

    return path;
}
