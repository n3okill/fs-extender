import * as fs from "./patch";
const fsAux = process.env["FS_EXTENDER_FS_OVERRIDE"] ? require(process.env["FS_EXTENDER_FS_OVERRIDE"]) : require("fs");

import { Type } from "@n3okill/utils";
import * as util from "../util";
const IgnorePatch = util.parseBoolean(process.env["FS_EXTENDER_IGNORE_PATCH"]);

/**
 * Test whether or not the given path exists by checking with the file system.
 * Then call the `callback` argument with either true or false:
 *
 * ```js
 * import { exists } from 'fs-extender';
 *
 * exists('/etc/passwd', (err, e) => {
 *   console.log(e ? 'it exists' : 'no passwd!');
 * });
 * ```
 * This method normalizes the functioning of the exists function of Node.js, returning an error as the first argument of callback
 *
 * Using `fs.exists()` to check for the existence of a file before calling`fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended. Doing
 * so introduces a race condition, since other processes may change the file's
 * state between the two calls. Instead, user code should open/read/write the
 * file directly and handle the error raised if the file does not exist.
 *
 * **write (NOT RECOMMENDED)**
 *
 * ```js
 * import { exists, open, close } from 'fs-extender';
 *
 * exists('myfile', (err, e) => {
 *   if (e) {
 *     console.error('myfile already exists');
 *   } else {
 *     open('myfile', 'wx', (err, fd) => {
 *       if (err) throw err;
 *
 *       try {
 *         writeMyData(fd);
 *       } finally {
 *         close(fd, (err) => {
 *           if (err) throw err;
 *         });
 *       }
 *     });
 *   }
 * });
 * ```
 *
 * **write (RECOMMENDED)**
 *
 * ```js
 * import { open, close, lstatSync } from 'fs-extender';
 * open('myfile', 'wx', (err, fd) => {
 *   if (err) {
 *     if (err.code === 'EEXIST') {
 *       console.error('myfile already exists');
 *       return;
 *     }
 *
 *     throw err;
 *   }
 *
 *   try {
 *     writeMyData(fd);
 *   } finally {
 *     close(fd, (err) => {
 *       if (err) throw err;
 *     });
 *   }
 * });
 * ```
 *
 * **read (NOT RECOMMENDED)**
 *
 * ```js
 * import { open, close, exists } from 'fs-extender';
 *
 * exists('myfile', (err, e) => {
 *   if (e) {
 *     open('myfile', 'r', (err, fd) => {
 *       if (err) throw err;
 *
 *       try {
 *         readMyData(fd);
 *       } finally {
 *         close(fd, (err) => {
 *           if (err) throw err;
 *         });
 *       }
 *     });
 *   } else {
 *     console.error('myfile does not exist');
 *   }
 * });
 * ```
 *
 * **read (RECOMMENDED)**
 *
 * ```js
 * import { open, close } from 'fs-extender';
 *
 * open('myfile', 'r', (err, fd) => {
 *   if (err) {
 *     if (err.code === 'ENOENT') {
 *       console.error('myfile does not exist');
 *       return;
 *     }
 *
 *     throw err;
 *   }
 *
 *   try {
 *     readMyData(fd);
 *   } finally {
 *     close(fd, (err) => {
 *       if (err) throw err;
 *     });
 *   }
 * });
 * ```
 *
 * The "not recommended" examples above check for existence and then use the
 * file; the "recommended" examples are better because they use the file directly
 * and handle the error, if any.
 *
 * In general, check for the existence of a file only if the file won’t be
 * used directly, for example when its existence is a signal from another
 * process.
 */
export function exists(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, exists: boolean) => void
): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        if (!fsAux.exists) {
            Reflect.apply(existAccess, fs, [path, callback]);
        } else {
            Reflect.apply(fsAux.exists, fs, [
                path,
                (val: boolean) => {
                    callback(null, val);
                },
            ]);
        }
    } else {
        Reflect.apply(fs.exists, fs, [path, callback]);
    }
}

/**
 * Check if it is possible to access the `path` object
 * `callback` gets 2 arguments `(err, exist:boolean)`
 * @param path fs.PathLike
 * @param mode
 * @param callback
 */
export function existAccess(
    path: fs.PathLike,
    mode: number | undefined,
    callback: (err: NodeJS.ErrnoException | null, result: boolean) => void
): void;
export function existAccess(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, result: boolean) => void
): void;
export function existAccess(path: fs.PathLike, mode: unknown, callback?: unknown): void {
    if (Type.isFunction(mode)) {
        callback = mode;
        mode = undefined;
    }
    Reflect.apply(fs.access, fs, [
        path,
        mode,
        (err: NodeJS.ErrnoException | null) => {
            (callback as (err: NodeJS.ErrnoException | null, result: boolean) => void)(null, !err);
        },
    ]);
}

/**
 * Check if it is possible to access the `path` object
 * @param path
 * @param mode
 * @returns `boolean`
 */
export function existAccessSync(path: fs.PathLike, mode?: number | undefined): boolean {
    try {
        Reflect.apply(fs.accessSync, fs, [path, mode]);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Check if the item is a directory
 * @param path
 * @param callback
 */
export function statIsDirectory(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, isType: boolean, stats: fs.Stats | fs.BigIntStats) => void
): void {
    Reflect.apply(fs.stat, fs, [
        path,
        (err: NodeJS.ErrnoException | null, stats: fs.Stats | fs.BigIntStats) => {
            if (err) {
                /* istanbul ignore next */
                return callback(err, false, stats);
            }
            callback(null, stats.isDirectory(), stats);
        },
    ]);
}

/**
 * Check if path is a directory
 * @param path
 * @returns
 */
export function statIsDirectorySync(path: fs.PathLike): boolean {
    return Reflect.apply(fs.statSync, fs, [path]).isDirectory();
}

/**
 * Check if path is a file
 * @param path
 * @param callback
 */
export function statIsFile(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, isType: boolean, stats: fs.Stats | fs.BigIntStats) => void
): void {
    Reflect.apply(fs.stat, fs, [
        path,
        (err: NodeJS.ErrnoException | null, stats: fs.Stats | fs.BigIntStats) => {
            if (err) {
                return callback(err, false, stats);
            }
            callback(null, stats.isFile(), stats);
        },
    ]);
}

/**
 * Check if path is a file
 * @param path
 * @returns
 */
export function statIsFileSync(path: fs.PathLike): boolean {
    return Reflect.apply(fs.statSync, fs, [path]).isFile();
}

/**
 * Check if pat his a symbolik link
 * @param path
 * @param callback
 */
export function statIsSymbolicLink(
    path: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, isType: boolean, stats: fs.Stats | fs.BigIntStats) => void
): void {
    /* istanbul ignore next */
    Reflect.apply(fs.lstat, fs, [
        path,
        (err: NodeJS.ErrnoException | null, stats: fs.Stats | fs.BigIntStats) => {
            if (err) {
                return callback(err, false, stats);
            }
            callback(null, stats.isSymbolicLink(), stats);
        },
    ]);
}

/**
 * Check if path is a symbolik link
 * @param path
 * @returns
 */
export function statIsSymbolicLinkSync(path: fs.PathLike): boolean {
    return Reflect.apply(fs.lstatSync, fs, [path]).isSymbolicLink();
}

/**
 * Check if given path is empty, if it's a folder it will use
 * `readdir` and check the number of returing items,
 * if it's another thing it will return the `size === 0`.
 * Will throw any error that happens while checking
 */
export function isEmpty(
    path: fs.PathLike,
    options: { dereference?: boolean },
    callback: (err: NodeJS.ErrnoException | null, empty: boolean) => void
): void;
export function isEmpty(path: fs.PathLike, callback: (err: NodeJS.ErrnoException | null, empty: boolean) => void): void;
export function isEmpty(path: fs.PathLike, options: unknown, callback?: unknown): void {
    const cb = util.getCallback(options, callback);
    const dereference = util.getObjectOption(options, "dereference", false);

    const stat = dereference ? fs.stat : fs.lstat;
    stat(path, (err: NodeJS.ErrnoException | null, stats: fs.Stats) => {
        if (err) {
            return cb(err);
        }
        if (stats.isDirectory()) {
            fs.readdir(path, (err2: NodeJS.ErrnoException | null, items: string[]) => {
                if (err2) {
                    /* istanbul ignore next */
                    return cb(err2);
                }
                return cb(null, items.length === 0);
            });
        } else {
            cb(null, stats.size === 0);
        }
    });
}

/**
 * Check if given path is empty, if it's a folder it will use
 * `readdir` and check the number of returing items,
 * if it's another thing it will return the `size === 0`.
 * Will throw any error that happens while checking
 */
export function isEmptySync(path: fs.PathLike, options: { dereference?: boolean } = { dereference: false }): boolean {
    const dereference = util.getObjectOption(options, "dereference", false);

    const stat = dereference ? fs.statSync : fs.lstatSync;
    const stats = stat(path);
    if (stats.isDirectory()) {
        const items = fs.readdirSync(path);
        return items.length === 0;
    } else {
        return stats.size === 0;
    }
}
