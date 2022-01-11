import * as fs from "../patch/patch.js";
import * as util from "../util.js";
import NodePath from "path-extender";
import { Type } from "@n3okill/utils";

export type WalkFunction = (
    err: NodeJS.ErrnoException | null,
    path: string | Buffer,
    stats: fs.Stats
) => boolean | void;
export type WalkAsyncFunction =
    | WalkFunction
    | ((err: NodeJS.ErrnoException | null, path: string | Buffer, stats: fs.Stats) => Promise<boolean | void>);

export type WalkOptions = {
    dereference?: boolean;
};

/**@internal */
type _WalkOptionsInternal = Required<WalkOptions> & {
    encoding: string;
};

/**@internal */
function getOptions(opt?: unknown): _WalkOptionsInternal {
    return {
        dereference: util.getObjectOption(opt, "dereference", false),
        encoding: "utf8",
    };
}

/**
 * Walk trough directories
 *
 * ```js
 * import * as fs from "fs-extender";
 *
 * let files = 0;
 * let dirs = 0;
 * fs.walk(path,
 *      (err, path, stats) => {
 *          if (stats.isDirectory()) {
 *              dirs++;
 *          } else {
 *              files++;
 *          }
 *       },
 *       (err) => {
 *          console.log(`files: ${files.length}`);
 *          console.log(`dirs: ${dirs.length}`);
 *        }
 * );
 * ```
 *
 * @param path - fs-PathLike
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * @param walkFunction - function to be called for each item found in path -
 * `(err: nodeJs.ErrNoException | null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean`
 * if walkFunction return `true` will stop the execution
 * @param callback - function to be called at the end of the execution
 */
export function walk(
    path: fs.PathLike,
    options: WalkOptions,
    walkFunction: WalkFunction,
    callback: (err: NodeJS.ErrnoException | null) => void
): void;
export function walk(
    path: fs.PathLike,
    walkFunction: WalkFunction,
    callback: (err: NodeJS.ErrnoException | null) => void
): void;
export function walk(path: fs.PathLike, options: unknown, walkFunction: unknown, callback?: unknown): void {
    let wf = walkFunction as WalkFunction;
    let cb = callback as (err: NodeJS.ErrnoException | null) => void;
    if (Type.isFunction(options)) {
        wf = options as WalkFunction;
        cb = walkFunction as (err: NodeJS.ErrnoException | null) => void;
        options = {};
    }
    const opt = getOptions(options);
    _walk(path, opt, wf)
        .then(() => cb(null))
        .catch((err) => cb(err));
}

/**@internal */
async function _walk(path: fs.PathLike, options: _WalkOptionsInternal, wf: WalkAsyncFunction): Promise<void> {
    let err: NodeJS.ErrnoException | null = null;

    if (Buffer.isBuffer(path)) {
        options.encoding = "buffer";
    } else {
        path = util.fileURLToPath(path);
    }

    const stat = options.dereference ? fs.promises.stat : fs.promises.lstat;
    let stack = [path];
    let stop = false;
    do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const p = stack.pop()!;
        let stats: fs.Stats | undefined;
        try {
            stats = await stat(p);
        } catch (er) {
            err = er as NodeJS.ErrnoException;
        }
        stop = (await wf(err, p, stats as fs.Stats)) || false;
        if (stats) {
            if (!stats.isDirectory()) {
                continue;
            } else {
                try {
                    stack = stack.concat(
                        (
                            await fs.promises.readdir(p, {
                                encoding: options.encoding as never,
                            })
                        ).map((s) => NodePath.join(p, s))
                    );
                } catch (er) {
                    stop = (await wf(er as NodeJS.ErrnoException, p, stats)) || false;
                }
            }
        }
    } while (stack.length && !stop);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * Walk trough directories
     *
     * ```js
     * import * as fs from "fs-extender";
     *
     * let files = 0;
     * let dirs = 0;
     * await fs.promises.walk(path,
     *      (err, path, stats) => {
     *          if (stats.isDirectory()) {
     *              dirs++;
     *          } else {
     *              files++;
     *          }
     *       });
     * console.log(`files: ${files.length}`);
     * console.log(`dirs: ${dirs.length}`);
     * ```
     *
     * @param path - fs-PathLike
     * @param options - options
     * - `dereference` - Dereference links, default is `false`
     * @param walkFunction - function to be called for each item found in path -
     * `(err: nodeJs.ErrNoException | null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean`
     * if walkFunction return `true` will stop the execution
     */
    export function walk(path: fs.PathLike, options: WalkOptions, walkFunction: WalkAsyncFunction): Promise<void>;
    export function walk(path: fs.PathLike, walkFunction: WalkAsyncFunction): Promise<void>;
    export function walk(path: fs.PathLike, options: unknown, walkFunction?: unknown): Promise<void> {
        let wf = walkFunction as WalkAsyncFunction;
        if (Type.isFunction(options) && !walkFunction) {
            wf = options as WalkAsyncFunction;
            options = {};
        }
        const opt = getOptions(options);
        return _walk(path, opt, wf);
    }
}

/**
 * Walk trough directories
 *
 * ```js
 * import * as fs from "fs-extender";
 *
 * let files = 0;
 * let dirs = 0;
 * fs.walkSync(path,
 *      (err, path, stats) => {
 *          if (stats.isDirectory()) {
 *              dirs++;
 *          } else {
 *              files++;
 *          }
 *       });
 * console.log(`files: ${files.length}`);
 * console.log(`dirs: ${dirs.length}`);
 * ```
 *
 * @param path - fs-PathLike
 * @param options - options
 * - `dereference` - Dereference links, default is `false`
 * @param walkFunction - function to be called for each item found in path -
 * `(err: nodeJs.ErrNoException | null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean`
 * if walkFunction return `true` will stop the execution
 */
export function walkSync(path: fs.PathLike, options: WalkOptions, walkFunction: WalkFunction): void;
export function walkSync(path: fs.PathLike, walkFunction: WalkFunction): void;
export function walkSync(path: fs.PathLike, options: unknown, walkFunction?: unknown): void {
    let wf = walkFunction as WalkFunction;
    if (Type.isFunction(options) && !walkFunction) {
        wf = options as WalkFunction;
        options = {};
    }
    const opt = getOptions(options);
    if (Buffer.isBuffer(path)) {
        opt.encoding = "buffer";
    } else {
        path = util.fileURLToPath(path);
    }
    let err: NodeJS.ErrnoException | null = null;
    //let stop = false;
    const stat = opt.dereference ? fs.statSync : fs.lstatSync;
    let stop = false;
    let stack = [path];
    do {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const p = stack.pop()!;
        let stats: fs.Stats | undefined;
        try {
            stats = stat(p);
        } catch (er) {
            err = er as NodeJS.ErrnoException;
        }
        stop = wf(err, p, stats as fs.Stats) || false;
        if (stats) {
            if (!stats.isDirectory()) {
                continue;
            } else {
                try {
                    stack = stack.concat(fs.readdirSync(p).map((s) => NodePath.join(p, s)));
                } catch (er) {
                    stop = wf(er as NodeJS.ErrnoException, p, stats) || false;
                }
            }
        }
    } while (stack.length && !stop);
}
