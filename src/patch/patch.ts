import * as NodeFs from "fs";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodeFsAux = require("fs");

const fs: typeof NodeFs = process.env["FS_EXTENDER_FS_OVERRIDE"]
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      (require(process.env["FS_EXTENDER_FS_OVERRIDE"]) as typeof NodeFs)
    : NodeFsAux;
if (process.env["FS_EXTENDER_FS_OVERRIDE"]) {
    /* istanbul ignore next */
    for (const key of Object.keys(fs)) {
        module.exports[key] = (fs as never)[key];
    }
}

import { Type, NumberUtil } from "@n3okill/utils";
import { Abortable } from "events";
import * as NodeOs from "os";
import * as _rm from "../rm";
import { getObjectOption, parseBoolean } from "../util";
import NodePath from "path-extender";

/**@internal */
const IsWindows = /^win/.test(NodeOs.platform());

export * from "fs";

export const originalFn = Symbol.for("fsExtender.original.fn");
export const fsExtenderQueueSymbol = Symbol.for("fsExtender.Queue");

const MaxTimeout = process.env["FS_EXTENDER_TIMEOUT"] ? parseInt(process.env["FS_EXTENDER_TIMEOUT"]) : 60000;
const MaxTimeoutSync = process.env["FS_EXTENDER_TIMEOUT_SYNC"]
    ? parseInt(process.env["FS_EXTENDER_TIMEOUT_SYNC"])
    : 60000;
const RenameMaxTime = process.env["FS_EXTENDER_WIN32_TIMEOUT"]
    ? parseInt(process.env["FS_EXTENDER_WIN32_TIMEOUT"], 10)
    : MaxTimeout;
const RenameMaxTimeoutSync = process.env["FS_EXTENDER_WIN32_TIMEOUT_SYNC"]
    ? parseInt(process.env["FS_EXTENDER_WIN32_TIMEOUT_SYNC"], 10)
    : MaxTimeoutSync;
const IgnorePatch = process.env["FS_EXTENDER_IGNORE_PATCH"]
    ? parseBoolean(process.env["FS_EXTENDER_IGNORE_PATCH"])
    : false;
const platform = process.env["FS_EXTENDER_TEST_PLATFORM"] || NodeOs.platform();
const IgnorePathClose = process.env["FS_EXTENDER_IGNORE_PATCH_CLOSE"]
    ? parseBoolean(process.env["FS_EXTENDER_IGNORE_PATCH_CLOSE"])
    : IgnorePatch;

/**@internal */
let cwd: string | null = null;

/**@internal */
process.cwd = ((cwdFn: () => string): (() => string) => {
    return (): string => {
        if (!cwd) {
            cwd = cwdFn.call(process);
        }
        return cwd;
    };
})(process.cwd);

try {
    process.cwd();
} catch (er) {
    //Intentionally left blank
}

if (Type.isFunction(process.chdir)) {
    const chdir = process.chdir;
    process.chdir = function (dir: string): void {
        cwd = null;
        chdir.call(process, dir);
    };
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(process.chdir, chdir);
    }
}

/**@internal */
type FifoType = [CallableFunction, Array<unknown>, NodeJS.ErrnoException | null, number, number];

/**@internal */
function publishQueue(context: Record<string, unknown>, queue: Array<FifoType>) {
    Object.defineProperty(context, fsExtenderQueueSymbol, {
        get: function () {
            return queue;
        },
    });
}

/**@internal */
export function getQueue(): Array<FifoType> | undefined {
    /* istanbul ignore next */
    return (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol];
}

if (Type.isUndefined((fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol])) {
    if (!IgnorePatch) {
        const queue = (global as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol] || [];
        publishQueue(fs, queue);
        patchClose(fs);
    }
}

/**@internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchClose(_fs: any) {
    if (IgnorePathClose) {
        return;
    }
    // Patch fs.close/closeSync to shared queue version, because we need
    // to retry() whenever a close happens *anywhere* in the program.
    // This is essential when multiple fs-extender instances are
    // in play at the same time.
    _fs.close = (function (close) {
        function closeFsExtender(fd: number, cb: NodeFs.NoParamCallback): void {
            return Reflect.apply(close, _fs, [
                fd,
                (err: NodeJS.ErrnoException | null): void => {
                    if (!err) {
                        processQueue();
                    }
                    Reflect.apply(cb, _fs, [err]);
                },
            ]);
        }
        return closeFsExtender;
    })(_fs.close);
    _fs.closeSync = (function (close) {
        function closeSyncFsExtender(fd: number): void {
            Reflect.apply(close, _fs, [fd]);
            processQueue();
        }
        return closeSyncFsExtender;
    })(_fs.closeSync);
}

if (Type.isUndefined((global as unknown as Record<symbol, CallableFunction>)[fsExtenderQueueSymbol])) {
    if (!IgnorePatch) {
        publishQueue(global, (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol]);
    }
}

/**@internal */
/* istanbul ignore next */
function addQueue(elem: FifoType): void {
    (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol].push(elem);
    retry();
}

// reset the startTime and lastTime to now
// this resets the start of the 60 second overall timeout as well as the
// delay between attempts so that we'll retry these jobs sooner
/**@internal */
/* istanbul ignore next */
function processQueue(): void {
    const now = Date.now();
    const queue: Array<unknown> = (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol];
    if (Type.isArray(queue)) {
        for (let i = 0; i < queue.length; ++i) {
            (queue[i] as FifoType)[3] = now; //startTime
            (queue[i] as FifoType)[4] = now; //stopTime
        }
        // call retry to make sure we're actively processing the queue
        retry();
    }
}
// keep track of the timeout between retry() calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let retryTimer: any;

/**@internal */
/* istanbul ignore next */
function retry(): void {
    clearImmediate(retryTimer);
    retryTimer = undefined;

    if ((fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol].length === 0) {
        return;
    }
    const elem = (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol].shift() as FifoType;
    const fn = elem[0];
    const args = elem[1];
    const err = elem[2];
    const startTime = elem[3];
    const lastTime = elem[4];
    // if we don't have a startTime we have no way of knowing if we've waited
    // long enough, so go ahead and retry this item now
    if (Type.isUndefined(startTime)) {
        Reflect.apply(fn, null, args);
    } else if (Date.now() - startTime >= 60000) {
        // it's been more than 60 seconds total, bail now
        const cb = args.pop();
        if (Type.isFunction(cb)) {
            Reflect.apply(cb as unknown as CallableFunction, null, [err]);
        }
    } else {
        // the amount of time between the last attempt and right now
        const sinceAttempt = Date.now() - lastTime;
        // the amount of time between when we first tried, and when we last tried
        // rounded up to at least 1
        const sinceStart = Math.max(lastTime - startTime, 1);
        // backoff. wait longer than the total time we've been retrying, but only
        // up to a maximum of 100ms
        const desiredDelay = Math.min(sinceStart * 1.2, 100);
        // it's been long enough since the last retry, do it again
        if (sinceAttempt >= desiredDelay) {
            Reflect.apply(fn, null, [...args, startTime]);
        } else {
            // if we can't do this job yet, push it to the end of the queue
            // and let the next iteration check again
            (fs as Record<symbol, Array<FifoType>>)[fsExtenderQueueSymbol].push(elem);
        }
    }
    if (Type.isUndefined(retryTimer)) {
        retryTimer = setImmediate(retry);
    }
}

/**@internal */
function errorEnqueueOrCallback(
    this: unknown,
    fn: CallableFunction,
    args: Array<unknown>,
    argsResult: Array<unknown>,
    callback: CallableFunction,
    startTime?: number
) {
    const err = argsResult[0] as NodeJS.ErrnoException;
    if (err && (err.code === "EMFILE" || err.code === "ENFILE")) {
        /* istanbul ignore next */
        addQueue([fn, args, err, startTime || Date.now(), Date.now()]);
    } else {
        Reflect.apply(callback, this, argsResult);
    }
}

/**
 * Asynchronously append data to a file, creating the file if it does not yet
 * exist. `data` can be a string or a `Buffer`.
 *
 * The `mode` option only affects the newly created file. See {@link open} for more details.
 *
 * ```js
 * import { appendFile } from 'fs-extender';
 *
 * appendFile('message.txt', 'data to append', (err) => {
 *   if (err) throw err;
 *   console.log('The "data to append" was appended to file!');
 * });
 * ```
 *
 * If `options` is a string, then it specifies the encoding:
 *
 * ```js
 * import { appendFile } from 'fs-extender';
 *
 * appendFile('message.txt', 'data to append', 'utf8', callback);
 * ```
 *
 * The `path` may be specified as a numeric file descriptor that has been opened
 * for appending (using `fs.open()` or `fs.openSync()`). The file descriptor will
 * not be closed automatically.
 *
 * ```js
 * import { open, close, appendFile } from 'fs-extender';
 *
 * function closeFd(fd) {
 *   close(fd, (err) => {
 *     if (err) throw err;
 *   });
 * }
 *
 * open('message.txt', 'a', (err, fd) => {
 *   if (err) throw err;
 *
 *   try {
 *     appendFile(fd, 'data to append', 'utf8', (err) => {
 *       closeFd(fd);
 *       if (err) throw err;
 *     });
 *   } catch (err) {
 *     closeFd(fd);
 *     throw err;
 *   }
 * });
 * ```
 * @param path filename or file descriptor
 */
export function appendFile(
    path: NodeFs.PathOrFileDescriptor,
    data: string | Uint8Array,
    options: NodeFs.WriteFileOptions,
    callback: NodeFs.NoParamCallback
): void;
/**
 * Asynchronously append data to a file, creating the file if it does not exist.
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 */
export function appendFile(
    file: NodeFs.PathOrFileDescriptor,
    data: string | Uint8Array,
    callback: NodeFs.NoParamCallback
): void;
export function appendFile(
    path: NodeFs.PathOrFileDescriptor,
    data: string | Uint8Array,
    options: NodeFs.WriteFileOptions | NodeFs.NoParamCallback,
    callback?: NodeFs.NoParamCallback
): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        if (Type.isFunction(options)) {
            callback = options as NodeFs.NoParamCallback;
            options = null;
        }
        function fsAppendFile(
            path: NodeFs.PathOrFileDescriptor,
            data: string | Uint8Array,
            options: NodeFs.WriteFileOptions,
            callback: NodeFs.NoParamCallback,
            startTime?: number
        ): void {
            return fs.appendFile(path, data, options, (...args: Array<unknown>): void => {
                errorEnqueueOrCallback(fsAppendFile, [path, data, options, callback], args, callback, startTime);
            });
        }
        return fsAppendFile(path, data, options as NodeFs.WriteFileOptions, callback as NodeFs.NoParamCallback);
    } else {
        Reflect.apply(fs.appendFile, fs, [path, data, options, callback]);
    }
}

// Chown should not fail on einval or eperm if non-root.
// It should not fail on enosys ever, as this just indicates
// that a fs doesn't support the intended operation.

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
/* istanbul ignore next */
function chownErOk(err: NodeJS.ErrnoException | null) {
    if (!err) {
        return true;
    }

    if (err.code === "ENOSYS") {
        return true;
    }

    const nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
        if (err.code === "EINVAL" || err.code === "EPERM") return true;
    }

    return false;
}

/** @internal*/
/* istanbul ignore next */
function chownFix(
    orig: CallableFunction,
    path: NodeFs.PathLike | number,
    uid: number,
    gid: number,
    callback: NodeFs.NoParamCallback
): void {
    if (!IgnorePatch) {
        return Reflect.apply(orig, fs, [
            path,
            uid,
            gid,
            (err: NodeJS.ErrnoException | null): void => callback(chownErOk(err) ? null : err),
        ]);
    } else {
        Reflect.apply(orig, fs, [path, uid, gid, callback]);
    }
}

/** @internal*/
/* istanbul ignore next */
function chmodFix(
    orig: CallableFunction,
    path: NodeFs.PathLike | number,
    mode: NodeFs.Mode,
    callback: NodeFs.NoParamCallback
): void {
    if (!IgnorePatch) {
        return Reflect.apply(orig, fs, [
            path,
            mode,
            (err: NodeJS.ErrnoException | null) => callback(chownErOk(err) ? null : err),
        ]);
    } else {
        return Reflect.apply(orig, fs, [path, mode, callback]);
    }
}

/** @internal*/
/* istanbul ignore next */
function chownFixSync(orig: CallableFunction, path: NodeFs.PathLike | number, uid: number, gid: number): void {
    if (!IgnorePatch) {
        try {
            return Reflect.apply(orig, fs, [path, uid, gid]);
        } catch (err) {
            if (!chownErOk(err as NodeJS.ErrnoException)) {
                throw err;
            }
        }
    } else {
        return Reflect.apply(orig, fs, [path, uid, gid]);
    }
}

/** @internal*/
/* istanbul ignore next */
function chmodFixSync(orig: CallableFunction, path: NodeFs.PathLike | number, mode: NodeFs.Mode): void {
    if (!IgnorePatch) {
        try {
            return Reflect.apply(orig, fs, [path, mode]);
        } catch (err) {
            if (!chownErOk(err as NodeJS.ErrnoException)) {
                throw err;
            }
        }
    } else {
        return Reflect.apply(orig, fs, [path, mode]);
    }
}

/**
 * Asynchronously changes owner and group of a file. No arguments other than a
 * possible exception are given to the completion callback.
 *
 * See the POSIX [`chown(2)`](http://man7.org/linux/man-pages/man2/chown.2.html) documentation for more detail.
 */
export function chown(path: NodeFs.PathLike, uid: number, gid: number, callback: NodeFs.NoParamCallback): void {
    /* istanbul ignore next */
    return chownFix(fs.chown, path, uid, gid, callback);
}

/**
 * Sets the owner of the file. No arguments other than a possible exception are
 * given to the completion callback.
 *
 * See the POSIX [`fchown(2)`](http://man7.org/linux/man-pages/man2/fchown.2.html) documentation for more detail.
 */
export function fchown(fd: number, uid: number, gid: number, callback: NodeFs.NoParamCallback): void {
    /* istanbul ignore next */
    return chownFix(fs.fchown, fd, uid, gid, callback);
}

/**
 * Set the owner of the symbolic link. No arguments other than a possible
 * exception are given to the completion callback.
 *
 * See the POSIX [`lchown(2)`](http://man7.org/linux/man-pages/man2/lchown.2.html) documentation for more detail.
 */
export function lchown(path: NodeFs.PathLike, uid: number, gid: number, callback: NodeFs.NoParamCallback): void {
    /* istanbul ignore next */
    if (!fs.lchown) {
        process.nextTick(callback);
        return;
    }
    /* istanbul ignore next */
    return chownFix(fs.lchown, path, uid, gid, callback);
}

/**
 * Asynchronously changes the permissions of a file. No arguments other than a
 * possible exception are given to the completion callback.
 *
 * See the POSIX [`chmod(2)`](http://man7.org/linux/man-pages/man2/chmod.2.html) documentation for more detail.
 *
 * ```js
 * import { chmod } from 'fs-extender';
 *
 * chmod('my_file.txt', 0o775, (err) => {
 *   if (err) throw err;
 *   console.log('The permissions for file "my_file.txt" have been changed!');
 * });
 * ```
 */
export function chmod(path: NodeFs.PathLike, mode: NodeFs.Mode, callback: NodeFs.NoParamCallback): void {
    return chmodFix(fs.chmod, path, mode, callback);
}

/**
 * Sets the permissions on the file. No arguments other than a possible exception
 * are given to the completion callback.
 *
 * See the POSIX [`fchmod(2)`](http://man7.org/linux/man-pages/man2/fchmod.2.html) documentation for more detail.
 */
export function fchmod(fd: number, mode: NodeFs.Mode, callback: NodeFs.NoParamCallback): void {
    /* istanbul ignore next */
    return chmodFix(fs.fchmod, fd, mode, callback);
}

/**
 * Changes the permissions on a symbolic link. No arguments other than a possible
 * exception are given to the completion callback.
 *
 * This method is only implemented on macOS.
 *
 * See the POSIX [`lchmod(2)`](https://www.freebsd.org/cgi/man.cgi?query=lchmod&sektion=2) documentation for more detail.
 */
export function lchmod(path: NodeFs.PathLike, mode: NodeFs.Mode, callback: NodeFs.NoParamCallback): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        let lchmod = fs.lchmod as CallableFunction;
        // lchmod, broken prior to 0.6.2
        // back-port the fix here.
        if (fs.constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
            lchmod = function (path: NodeFs.PathLike, mode: NodeFs.Mode, callback: NodeFs.NoParamCallback) {
                open(
                    path,
                    fs.constants.O_WRONLY | fs.constants.O_SYMLINK,
                    mode,
                    (err: NodeJS.ErrnoException | null, fd: number) => {
                        if (err) {
                            if (callback) {
                                callback(err);
                            }
                            return;
                        }
                        // prefer to return the chmod error, if one occurs,
                        // but still try to close, and report closing errors if they occur.
                        fchmod(fd, mode, (err: NodeJS.ErrnoException | null) => {
                            fs.close(fd, function (err2: NodeJS.ErrnoException | null) {
                                if (callback) {
                                    callback(err || err2);
                                }
                            });
                        });
                    }
                );
            };
        }

        if (!lchmod) {
            process.nextTick(callback);
            return;
        }
        return chmodFix(lchmod, path, mode, callback);
    } else {
        return chmodFix(fs.lchmod, path, mode, callback);
    }
}

/**
 * Synchronously changes owner and group of a file. Returns `undefined`.
 * This is the synchronous version of {@link chown}.
 *
 * See the POSIX [`chown(2)`](http://man7.org/linux/man-pages/man2/chown.2.html) documentation for more detail.
 */
export function chownSync(path: NodeFs.PathLike, uid: number, gid: number): void {
    Reflect.apply(chownFixSync, fs, [fs.chownSync, path, uid, gid]);
}

/**
 * Sets the owner of the file. Returns `undefined`.
 *
 * See the POSIX [`fchown(2)`](http://man7.org/linux/man-pages/man2/fchown.2.html) documentation for more detail.
 * @param uid The file's new owner's user id.
 * @param gid The file's new group's group id.
 */
export function fchownSync(fd: number, uid: number, gid: number): void {
    /* istanbul ignore next */
    Reflect.apply(chownFixSync, fs, [fs.fchownSync, fd, uid, gid]);
}

/**
 * Set the owner for the path. Returns `undefined`.
 *
 * See the POSIX [`lchown(2)`](http://man7.org/linux/man-pages/man2/lchown.2.html) documentation for more details.
 * @param uid The file's new owner's user id.
 * @param gid The file's new group's group id.
 */
export function lchownSync(path: NodeFs.PathLike, uid: number, gid: number): void {
    /* istanbul ignore next */
    if (!fs.lchownSync) {
        return;
    }
    /* istanbul ignore next */
    Reflect.apply(chownFixSync, fs, [fs.lchownSync, path, uid, gid]);
}

/**
 * For detailed information, see the documentation of the asynchronous version of
 * this API: {@link chmod}.
 *
 * See the POSIX [`chmod(2)`](http://man7.org/linux/man-pages/man2/chmod.2.html) documentation for more detail.
 */
export function chmodSync(path: NodeFs.PathLike, mode: NodeFs.Mode): void {
    Reflect.apply(chmodFixSync, fs, [fs.chmodSync, path, mode]);
}

/**
 * Sets the permissions on the file. Returns `undefined`.
 *
 * See the POSIX [`fchmod(2)`](http://man7.org/linux/man-pages/man2/fchmod.2.html) documentation for more detail.
 */
export function fchmodSync(fd: number, mode: NodeFs.Mode): void {
    /* istanbul ignore next */
    Reflect.apply(chmodFixSync, fs, [fs.fchmodSync, fd, mode]);
}

/**
 * Changes the permissions on a symbolic link. Returns `undefined`.
 *
 * This method is only implemented on macOS.
 *
 * See the POSIX [`lchmod(2)`](https://www.freebsd.org/cgi/man.cgi?query=lchmod&sektion=2) documentation for more detail.
 */
export function lchmodSync(path: NodeFs.PathLike, mode: NodeFs.Mode): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        // lchmod, broken prior to 0.6.2
        // back-port the fix here.
        let lchmodSync = fs.lchmodSync as CallableFunction;
        if (fs.constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
            lchmodSync = function (path: NodeFs.PathLike, mode: NodeFs.Mode): void {
                const fd = fs.openSync(path, fs.constants.O_WRONLY | fs.constants.O_SYMLINK, mode);
                let threw = true;

                // prefer to return the chmod error, if one occurs,
                // but still try to close, and report closing errors if they occur.
                try {
                    fchmodSync(fd, mode);
                    threw = false;
                } finally {
                    if (threw) {
                        try {
                            fs.closeSync(fd);
                        } catch (err) {}
                    } else {
                        fs.closeSync(fd);
                    }
                }
            };
        }
        if (!lchmodSync) {
            return;
        }
        return Reflect.apply(chmodFixSync, fs, [lchmodSync, path, mode]);
    } else {
        return Reflect.apply(chmodFixSync, fs, [fs.lchownSync, path, mode]);
    }
}

/**
 * Asynchronously copies `src` to `dest`. By default, `dest` is overwritten if it
 * already exists. No arguments other than a possible exception are given to the
 * callback function. Node.js makes no guarantees about the atomicity of the copy
 * operation. If an error occurs after the destination file has been opened for
 * writing, Node.js will attempt to remove the destination.
 *
 * `mode` is an optional integer that specifies the behavior
 * of the copy operation. It is possible to create a mask consisting of the bitwise
 * OR of two or more values (e.g.`fs.constants.COPYFILE_EXCL | fs.constants.COPYFILE_FICLONE`).
 *
 * * `fs.constants.COPYFILE_EXCL`: The copy operation will fail if `dest` already
 * exists.
 * * `fs.constants.COPYFILE_FICLONE`: The copy operation will attempt to create a
 * copy-on-write reflink. If the platform does not support copy-on-write, then a
 * fallback copy mechanism is used.
 * * `fs.constants.COPYFILE_FICLONE_FORCE`: The copy operation will attempt to
 * create a copy-on-write reflink. If the platform does not support
 * copy-on-write, then the operation will fail.
 *
 * ```js
 * import { copyFile, constants } from 'fs-extender';
 *
 * function callback(err) {
 *   if (err) throw err;
 *   console.log('source.txt was copied to destination.txt');
 * }
 *
 * // destination.txt will be created or overwritten by default.
 * copyFile('source.txt', 'destination.txt', callback);
 *
 * // By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
 * copyFile('source.txt', 'destination.txt', constants.COPYFILE_EXCL, callback);
 * ```
 * @param src source filename to copy
 * @param dest destination filename of the copy operation
 * @param [mode=0] modifiers for copy operation.
 */
export function copyFile(src: NodeFs.PathLike, dest: NodeFs.PathLike, callback: NodeFs.NoParamCallback): void;
export function copyFile(
    src: NodeFs.PathLike,
    dest: NodeFs.PathLike,
    mode: number,
    callback: NodeFs.NoParamCallback
): void;
export function copyFile(
    src: NodeFs.PathLike,
    dest: NodeFs.PathLike,
    mode: number | NodeFs.NoParamCallback,
    callback?: NodeFs.NoParamCallback
): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        if (Type.isFunction(mode)) {
            callback = mode as NodeFs.NoParamCallback;
            mode = 0;
        }
        function fsCopyFile(
            src: NodeFs.PathLike,
            dest: NodeFs.PathLike,
            mode: number,
            callback: NodeFs.NoParamCallback,
            startTime?: number
        ): void {
            return fs.copyFile(src, dest, mode, function (this: unknown, ...args: Array<unknown>): void {
                errorEnqueueOrCallback(fsCopyFile, [src, dest, mode, callback], args, callback, startTime);
            });
        }
        return fsCopyFile(src, dest, mode as number, callback as NodeFs.NoParamCallback);
    } else {
        return Reflect.apply(fs.copyFile, fs, [src, dest, mode, callback]);
    }
}

/**
 * Changes the access and modification times of a file in the same way as {@link utimes}, with the difference that if the path refers to a symbolic
 * link, then the link is not dereferenced: instead, the timestamps of the
 * symbolic link itself are changed.
 *
 * No arguments other than a possible exception are given to the completion
 * callback.
 */
export function lutimes(
    path: NodeFs.PathLike,
    atime: NodeFs.TimeLike,
    mtime: NodeFs.TimeLike,
    callback: NodeFs.NoParamCallback
): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        if (!fs.lutimes) {
            if (fs.constants.hasOwnProperty("O_SYMLINK")) {
                open(path, fs.constants.O_SYMLINK, (err: NodeJS.ErrnoException | null, fd: number): void => {
                    if (err) {
                        if (callback) {
                            callback(err);
                        }
                        return;
                    }
                    fs.futimes(fd, atime, mtime, (errFutimes: NodeJS.ErrnoException | null) => {
                        fs.close(fd, (errClose: NodeJS.ErrnoException | null) => {
                            if (callback) {
                                callback(errFutimes || errClose);
                            }
                        });
                    });
                });
            } else {
                process.nextTick(callback);
            }
        } else {
            fs.lutimes(path, atime, mtime, callback);
        }
    } else {
        if (!fs.lutimes) {
            process.nextTick(callback);
        } else {
            Reflect.apply(fs.lutimes, fs, [path, atime, mtime, callback]);
        }
    }
}

/**
 * Change the file system timestamps of the symbolic link referenced by `path`.
 * Returns `undefined`, or throws an exception when parameters are incorrect or
 * the operation fails. This is the synchronous version of {@link lutimes}.
 */
export function lutimesSync(path: NodeFs.PathLike, atime: NodeFs.TimeLike, mtime: NodeFs.TimeLike): void {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        if (!fs.lutimesSync) {
            if (fs.constants.hasOwnProperty("O_SYMLINK")) {
                const fd = fs.openSync(path, fs.constants.O_SYMLINK);
                let threw = true;
                try {
                    fs.futimesSync(fd, atime, mtime);
                    threw = false;
                } finally {
                    if (threw) {
                        try {
                            fs.closeSync(fd);
                        } catch (err) {}
                    } else {
                        fs.closeSync(fd);
                    }
                }
            } else {
                return;
            }
        } else {
            fs.lutimesSync(path, atime, mtime);
        }
    } else {
        if (!fs.lutimes) {
            return;
        } else {
            return Reflect.apply(fs.lutimesSync, fs, [path, atime, mtime]);
        }
    }
}

/**
 * Asynchronous file open. See the POSIX [`open(2)`](http://man7.org/linux/man-pages/man2/open.2.html) documentation for more details.
 *
 * `mode` sets the file mode (permission and sticky bits), but only if the file was
 * created. On Windows, only the write permission can be manipulated; see {@link chmod}.
 *
 * The callback gets two arguments `(err, fd)`.
 *
 * Some characters (`< > : " / \ | ? *`) are reserved under Windows as documented
 * by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains
 * a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).
 *
 * Functions based on `fs.open()` exhibit this behavior as well:`fs.writeFile()`, `fs.readFile()`, etc.
 * @param [flags='r'] See `support of file system `flags``.
 * @param [mode=0o666]
 */
export function open(
    path: NodeFs.PathLike,
    flags: NodeFs.OpenMode,
    mode: NodeFs.Mode | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, fd: number) => void
): void;
/**
 * Asynchronous open(2) - open and possibly create a file. If the file is created, its mode will be `0o666`.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function open(
    path: NodeFs.PathLike,
    flags: NodeFs.OpenMode,
    callback: (err: NodeJS.ErrnoException | null, fd: number) => void
): void;
export function open(
    path: NodeFs.PathLike,
    flags: NodeFs.OpenMode,
    mode: NodeFs.Mode | undefined | null | ((err: NodeJS.ErrnoException | null, fd: number) => void),
    callback?: (err: NodeJS.ErrnoException | null, fd: number) => void
): void {
    if (!IgnorePatch) {
        if (Type.isFunction(mode)) {
            callback = mode as (err: NodeJS.ErrnoException | null, fd: number) => void;
            mode = null;
        }

        function fsOpen(
            path: NodeFs.PathLike,
            flags: NodeFs.OpenMode,
            mode: NodeFs.Mode | undefined | null,
            callback: (err: NodeJS.ErrnoException | null, fd: number) => void,
            startTime?: number
        ) {
            return fs.open(path, flags, mode, (...args: Array<unknown>): void => {
                errorEnqueueOrCallback(fsOpen, [path, flags, mode, callback], args, callback, startTime);
            });
        }
        return fsOpen(
            path,
            flags,
            mode as NodeFs.Mode | undefined | null,
            callback as (err: NodeJS.ErrnoException | null, fd: number) => void
        );
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.open, fs, [path, flags, mode, callback]);
    }
}

// if read() returns EAGAIN, then just try it again.
/**
 * Read data from the file specified by `fd`.
 *
 * The callback is given the three arguments, `(err, bytesRead, buffer)`.
 *
 * If the file is not modified concurrently, the end-of-file is reached when the
 * number of bytes read is zero.
 *
 * If this method is invoked as its `util.promisify()` ed version, it returns
 * a promise for an `Object` with `bytesRead` and `buffer` properties.
 * @param buffer The buffer that the data will be written to.
 * @param offset The position in `buffer` to write the data to.
 * @param length The number of bytes to read.
 * @param position Specifies where to begin reading from in the file. If `position` is `null` or `-1 `, data will be read from the current file position, and the file position will be updated. If
 * `position` is an integer, the file position will be unchanged.
 */
export function read<TBuffer extends NodeJS.ArrayBufferView>(
    fd: number,
    buffer: TBuffer,
    offset: number,
    length: number,
    position: NodeFs.ReadPosition | null,
    callback: (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer) => void
): void {
    if (!IgnorePatch) {
        let eagCounter = 0;
        const cb = (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer): void => {
            /* istanbul ignore next */
            if (err && err.code === "EAGAIN" && eagCounter < 10) {
                eagCounter++;
                return Reflect.apply(fs.read, fs, [fd, buffer, offset, length, position, cb]);
            }
            callback(err, bytesRead, buffer);
        };
        return Reflect.apply(fs.read, fs, [fd, buffer, offset, length, position, cb]);
    } else {
        /* istanbul ignore next */
        Reflect.apply(fs.read, fs, [fd, buffer, offset, length, position, callback]);
    }
}

/**
 * Returns the number of `bytesRead`.
 *
 * For detailed information, see the documentation of the asynchronous version of
 * this API: {@link read}.
 */
export function readSync(
    fd: number,
    buffer: NodeJS.ArrayBufferView,
    offset: number,
    length: number,
    position: NodeFs.ReadPosition | null
): number;
/**
 * Similar to the above `fs.readSync` function, this version takes an optional `options` object.
 * If no `options` object is specified, it will default with the above values.
 */
export function readSync(fd: number, buffer: NodeJS.ArrayBufferView, opts?: NodeFs.ReadSyncOptions): number;
export function readSync(...args: Array<unknown>): number {
    /* istanbul ignore next */
    if (!IgnorePatch) {
        let eagCounter = 0;
        while (true) {
            try {
                return Reflect.apply(fs.readSync, fs, args);
            } catch (e) {
                const err = e as NodeJS.ErrnoException;
                if (err.code === "EAGAIN" && eagCounter < 10) {
                    eagCounter++;
                    continue;
                }
                throw err;
            }
        }
    } else {
        return Reflect.apply(fs.readSync, fs, args);
    }
}

/**
 * Reads the contents of a directory. The callback gets two arguments `(err, files)`where `files` is an array of the names of the files in the directory excluding`'.'` and `'..'`.
 *
 * See the POSIX [`readdir(3)`](http://man7.org/linux/man-pages/man3/readdir.3.html) documentation for more details.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the filenames passed to the callback. If the `encoding` is set to `'buffer'`,
 * the filenames returned will be passed as `Buffer` objects.
 *
 * If `options.withFileTypes` is set to `true`, the `files` array will contain `fs.Dirent` objects.
 */
export function readdir(
    path: NodeFs.PathLike,
    options: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdir(
    path: NodeFs.PathLike,
    options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer",
    callback: (err: NodeJS.ErrnoException | null, files: Buffer[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdir(
    path: NodeFs.PathLike,
    options: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, files: string[] | Buffer[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function readdir(
    path: NodeFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
 */
export function readdir(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true },
    callback: (err: NodeJS.ErrnoException | null, files: NodeFs.Dirent[]) => void
): void;
export function readdir(path: NodeFs.PathLike, options: unknown, callback?: unknown): void {
    if (!IgnorePatch) {
        if (Type.isFunction(options)) {
            callback = options as (
                err: NodeJS.ErrnoException | null,
                files: string[] | Buffer[] | NodeFs.Dirent[]
            ) => void;
            options = null;
        }
        function fsReaddir(
            path: NodeFs.PathLike,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options: any,
            callback: (err: NodeJS.ErrnoException | null, files: string[] | Buffer[] | NodeFs.Dirent[]) => void,
            startTime?: number
        ) {
            return fs.readdir(path, options, (...args: Array<unknown>): void => {
                const files = args[1];
                if (files && (files as Array<unknown>).sort) {
                    (files as Array<unknown>).sort();
                    args[1] = files;
                }
                errorEnqueueOrCallback(fsReaddir, [path, options, callback], args, callback, startTime);
            });
        }
        return fsReaddir(
            path,
            options,
            callback as (err: NodeJS.ErrnoException | null, files: string[] | Buffer[] | NodeFs.Dirent[]) => void
        );
    } else {
        /* istanbul ignore next */
        Reflect.apply(fs.readdir, fs, [path, options, callback]);
    }
}

/**
 * Reads the contents of a directory. The callback gets two arguments `(err, files)`where `files`
 * is an array of the names of the files in the directory excluding`'.'` and `'..'`.
 *
 * See the POSIX [`readdir(3)`](http://man7.org/linux/man-pages/man3/readdir.3.html) documentation for more details.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the filenames passed to the callback. If the `encoding` is set to `'buffer'`,
 * the filenames returned will be passed as `Buffer` objects.
 *
 * If `options.withFileTypes` is set to `true`, the `files` array will contain `fs.Dirent` objects.
 */
export function readDir(
    path: NodeFs.PathLike,
    options: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDir(
    path: NodeFs.PathLike,
    options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer",
    callback: (err: NodeJS.ErrnoException | null, files: Buffer[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDir(
    path: NodeFs.PathLike,
    options: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, files: string[] | Buffer[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function readDir(
    path: NodeFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
): void;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
 */
export function readDir(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true },
    callback: (err: NodeJS.ErrnoException | null, files: NodeFs.Dirent[]) => void
): void;
export function readDir(path: NodeFs.PathLike, options: unknown, callback?: unknown): void {
    /* istanbul ignore next */
    return readdir(path, options as never, callback as never);
}

/**
 * Reads the contents of the directory.
 *
 * See the POSIX [`readdir(3)`](http://man7.org/linux/man-pages/man3/readdir.3.html) documentation for more details.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the filenames returned. If the `encoding` is set to `'buffer'`,
 * the filenames returned will be passed as `Buffer` objects.
 *
 * If `options.withFileTypes` is set to `true`, the result will contain `fs.Dirent` objects.
 */
export function readdirSync(
    path: NodeFs.PathLike,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null
): string[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdirSync(
    path: NodeFs.PathLike,
    options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer"
): Buffer[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdirSync(
    path: NodeFs.PathLike,
    options?: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | null
): string[] | Buffer[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
 */
export function readdirSync(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true }
): NodeFs.Dirent[];
export function readdirSync(path: NodeFs.PathLike, options?: unknown): string[] | Buffer[] | NodeFs.Dirent[] {
    if (!IgnorePatch) {
        return Reflect.apply(fs.readdirSync, fs, [path, options]).sort();
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.readdirSync, fs, [path, options]);
    }
}

/**
 * Reads the contents of the directory.
 *
 * See the POSIX [`readdir(3)`](http://man7.org/linux/man-pages/man3/readdir.3.html) documentation for more details.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the filenames returned. If the `encoding` is set to `'buffer'`,
 * the filenames returned will be passed as `Buffer` objects.
 *
 * If `options.withFileTypes` is set to `true`, the result will contain `fs.Dirent` objects.
 */
export function readDirSync(
    path: NodeFs.PathLike,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null
): string[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDirSync(
    path: NodeFs.PathLike,
    options: { encoding: "buffer"; withFileTypes?: false | undefined } | "buffer"
): Buffer[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDirSync(
    path: NodeFs.PathLike,
    options?: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | null
): string[] | Buffer[];
/**
 * Synchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent.
 */
export function readDirSync(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true }
): NodeFs.Dirent[];
export function readDirSync(path: NodeFs.PathLike, options?: unknown): string[] | Buffer[] | NodeFs.Dirent[] {
    /* istanbul ignore next */
    return readdirSync(path, options as never);
}

/**
 * Asynchronously reads the entire contents of a file.
 *
 * ```js
 * import { readFile } from 'fs-extender';
 *
 * readFile('/etc/passwd', (err, data) => {
 *   if (err) throw err;
 *   console.log(data);
 * });
 * ```
 *
 * The callback is passed two arguments `(err, data)`, where `data` is the
 * contents of the file.
 *
 * If no encoding is specified, then the raw buffer is returned.
 *
 * If `options` is a string, then it specifies the encoding:
 *
 * ```js
 * import { readFile } from 'fs-extender';
 *
 * readFile('/etc/passwd', 'utf8', callback);
 * ```
 *
 * When the path is a directory, the behavior of `fs.readFile()` and {@link readFileSync} is platform-specific. On macOS, Linux, and Windows, an
 * error will be returned. On FreeBSD, a representation of the directory's contents
 * will be returned.
 *
 * ```js
 * import { readFile } from 'fs-extender';
 *
 * // macOS, Linux, and Windows
 * readFile('<directory>', (err, data) => {
 *   // => [Error: EISDIR: illegal operation on a directory, read <directory>]
 * });
 *
 * //  FreeBSD
 * readFile('<directory>', (err, data) => {
 *   // => null, <data>
 * });
 * ```
 *
 * It is possible to abort an ongoing request using an `AbortSignal`. If a
 * request is aborted the callback is called with an `AbortError`:
 *
 * ```js
 * import { readFile } from 'fs-extender';
 *
 * const controller = new AbortController();
 * const signal = controller.signal;
 * readFile(fileInfo[0].name, { signal }, (err, buf) => {
 *   // ...
 * });
 * // When you want to abort the request
 * controller.abort();
 * ```
 *
 * The `fs.readFile()` function buffers the entire file. To minimize memory costs,
 * when possible prefer streaming via `fs.createReadStream()`.
 *
 * Aborting an ongoing request does not abort individual operating
 * system requests but rather the internal buffering `fs.readFile` performs.
 * @param path filename or file descriptor
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options:
        | ({
              encoding?: null | undefined;
              flag?: string | undefined;
          } & Abortable)
        | undefined
        | null,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
): void;
/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
 * If a flag is not provided, it defaults to `'r'`.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options: ({ encoding: BufferEncoding; flag?: string | undefined } & Abortable) | BufferEncoding,
    callback: (err: NodeJS.ErrnoException | null, data: string) => void
): void;
/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
 * If a flag is not provided, it defaults to `'r'`.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options:
        | (NodeFs.ObjectEncodingOptions & {
              flag?: string | undefined;
          } & Abortable)
        | BufferEncoding
        | undefined
        | null,
    callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void
): void;
/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
): void;
export function readFile(path: NodeFs.PathOrFileDescriptor, options: unknown, callback?: unknown): void {
    if (!IgnorePatch) {
        /* istanbul ignore next */
        if (Type.isFunction(options)) {
            callback = options as (err: NodeJS.ErrnoException | null, data: string | Buffer) => void;
            options = null;
        }
        function fsReadFile(
            path: NodeFs.PathOrFileDescriptor,
            options: unknown,
            callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void,
            startTime?: number
        ) {
            return fs.readFile(path, options as never, (...args: unknown[]): void => {
                errorEnqueueOrCallback(fsReadFile, [path, options, callback], args, callback, startTime);
            });
        }
        return fsReadFile(
            path,
            options,
            callback as (err: NodeJS.ErrnoException | null, data: string | Buffer) => void
        );
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.readFile, fs, [path, options, callback]);
    }
}

/**
 * Asynchronously rename file at `oldPath` to the pathname provided
 * as `newPath`. In the case that `newPath` already exists, it will
 * be overwritten. If there is a directory at `newPath`, an error will
 * be raised instead. No arguments other than a possible exception are
 * given to the completion callback.
 *
 * See also: [`rename(2)`](http://man7.org/linux/man-pages/man2/rename.2.html).
 *
 * ```js
 * import { rename } from 'fs-extender';
 *
 * rename('oldFile.txt', 'newFile.txt', (err) => {
 *   if (err) throw err;
 *   console.log('Rename complete!');
 * });
 * ```
 *
 * on Windows, A/V software can lock the directory, causing this
 * to fail with an EACCES or EPERM if the directory contains newly
 * created files.  Try again on failure, for up to `process.env["FS-FS_EXTENDER_WIN32_TIMEOUT"]` (60 seconds default).
 *
 * Set the timeout this long because some Windows Anti-Virus, such as Parity
 * bit9, may lock files for up to a minute, causing npm package install
 * failures. Also, take care to yield the scheduler. Windows scheduling gives
 * CPU to a busy looping process, which can cause the program causing the lock
 * contention to be starved of CPU by node, so the contention doesn't resolve.
 *
 * Change max time with `process.env["FS-FS_EXTENDER_WIN32_TIMEOUT"]`
 */
/* istanbul ignore next */
export function rename(oldPath: NodeFs.PathLike, newPath: NodeFs.PathLike, callback: NodeFs.NoParamCallback): void {
    if (platform === "win32" && !IgnorePatch) {
        const startTime = Date.now();
        let backOff = 0;
        const stopTime = startTime + RenameMaxTime;
        const CB = (err: NodeJS.ErrnoException | null): void => {
            if (err && (err.code === "EACCES" || err.code === "EPERM") && Date.now() < stopTime) {
                setTimeout(() => {
                    stat(oldPath, (errOldPath: NodeJS.ErrnoException | null, statOldPath: NodeFs.Stats) => {
                        stat(newPath, (errNewPath: NodeJS.ErrnoException | null, statNewPath: NodeFs.Stats) => {
                            if (errOldPath && !errNewPath) {
                                //if the source no longer exists we can probably assume it was moved
                                /* istanbul ignore next */
                                callback(null);
                            } else if (
                                statOldPath &&
                                statNewPath &&
                                statOldPath.size === statNewPath.size &&
                                statOldPath.ctime === statNewPath.ctime
                            ) {
                                //if the source and target have the same size and ctime, we can assume it was moved
                                /* istanbul ignore next */
                                callback(null);
                            } else {
                                fs.rename(oldPath, newPath, CB);
                            }
                        });
                    });
                }, backOff);
                if (backOff < 100) {
                    backOff += 10;
                }
            } else if (backOff && stopTime > startTime && err && err.code === "ENOENT") {
                //the source no longer exists so we can assume it was moved during one of the tries
                /* istanbul ignore next */
                return callback(null);
            } else {
                return callback(err);
            }
        };
        fs.rename(oldPath, newPath, CB);
    } else {
        fs.rename(oldPath, newPath, callback);
    }
}

/**
 * Renames the file from `oldPath` to `newPath`. Returns `undefined`.
 *
 * **ATTENTION**: In win32 platform this function will block the event loop until the file is renamed or timeout, use with care
 *
 * See the POSIX [`rename(2)`](http://man7.org/linux/man-pages/man2/rename.2.html) documentation for more details.
 *
 * on Windows, A/V software can lock the directory, causing this
 * to fail with an EACCES or EPERM if the directory contains newly
 * created files.  Try again on failure, for up to `process.env["FS_EXTENDER_WIN32_TIMEOUTSYNC"]` (60 seconds default).
 *
 * Set the timeout this long because some Windows Anti-Virus, such as Parity
 * bit9, may lock files for up to a minute, causing npm package install
 * failures. Also, take care to yield the scheduler. Windows scheduling gives
 * CPU to a busy looping process, which can cause the program causing the lock
 * contention to be starved of CPU by node, so the contention doesn't resolve.
 *
 * Change max time with `process.env["FS_EXTENDER_WIN32_TIMEOUT_SYNC"]`
 */
/* istanbul ignore next */
export function renameSync(oldPath: NodeFs.PathLike, newPath: NodeFs.PathLike): void {
    if (platform === "win32" && !IgnorePatch) {
        const startTime = Date.now();
        const stopTime = startTime + RenameMaxTimeoutSync;
        let callAgain = 0;
        const tryRename = (): void => {
            try {
                return fs.renameSync(oldPath, newPath);
            } catch (er) {
                const err = er as NodeJS.ErrnoException;
                if ((err.code === "EACCES" || err.code === "EPERM") && Date.now() < stopTime) {
                    try {
                        statSync(newPath);
                    } catch (erStat) {
                        const errStat = erStat as NodeJS.ErrnoException;
                        if (errStat.code === "ENOENT") {
                            if (callAgain < 100) {
                                callAgain += 10;
                            }
                            const waitUntil = Date.now() + callAgain;
                            while (waitUntil < Date.now()) {}
                            return tryRename();
                        }
                    }
                    /* istanbul ignore next */
                    throw err;
                } else if (callAgain > 0 && err.code === "ENOENT") {
                    //the source no longer exists because so we can assume it was moved
                } else {
                    throw err;
                }
                //wait until target exists and source no longer exists or that we've reached the backoff limit
                /* istanbul ignore next */
                while ((fs.existsSync(oldPath) || !fs.existsSync(newPath)) && Date.now() < stopTime) {}
            }
        };
        tryRename();
    } else {
        fs.renameSync(oldPath, newPath);
    }
}

/**
 * Asynchronous [`rmdir(2)`](http://man7.org/linux/man-pages/man2/rmdir.2.html). No arguments other than a possible exception are given
 * to the completion callback.
 *
 * Using `fs.rmdir()` on a file (not a directory) results in an `ENOENT` error on
 * Windows and an `ENOTDIR` error on POSIX.
 *
 * To get a behavior similar to the `rm -rf` Unix command, use {@link rm} with options `{ recursive: true, force: true }`.
 */
export function rmdir(path: NodeFs.PathLike, options: NodeFs.RmDirOptions, callback: NodeFs.NoParamCallback): void;
export function rmdir(path: NodeFs.PathLike, callback: NodeFs.NoParamCallback): void;
export function rmdir(path: NodeFs.PathLike, options: unknown, callback?: unknown): void {
    if (!IgnorePatch) {
        let cb: NodeFs.NoParamCallback;
        /* istanbul ignore next */
        if (Type.isFunction(options) && !callback) {
            cb = options as NodeFs.NoParamCallback;
            options = {};
        } else {
            cb = callback as NodeFs.NoParamCallback;
        }
        const opt: Required<NodeFs.RmDirOptions> = {
            maxRetries: getObjectOption(options, "maxRetries", 0),
            retryDelay: getObjectOption(options, "retryDelay", 100),
            recursive: getObjectOption(options, "recursive", false),
        };
        if ("maxBusyTries" in ((options || {}) as NodeFs.RmDirOptions)) {
            /* istanbul ignore next */
            opt.maxRetries = (options as unknown as Record<string, number>)["maxBusyTries"];
        }

        stat(path, (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => {
            if (err) {
                /* istanbul ignore next */
                return cb(err);
            }
            /* istanbul ignore next */
            if (!stats.isDirectory()) {
                const e: NodeJS.ErrnoException = new Error(`'${path}' is not a directory.`);
                e.code = IsWindows ? "ENOENT" : "ENOTDIR";
                return cb(e);
            } else {
                if ("recursive" in opt && opt.recursive) {
                    _rm.rm(path, { force: true, recursive: true }, cb);
                } else {
                    let retries = 0;
                    function retry() {
                        fs.rmdir(path, (err: NodeJS.ErrnoException | null) => {
                            if (err) {
                                if (err.code === "ENOENT") {
                                    /* istanbul ignore next */
                                    return cb(null);
                                } else if (
                                    ["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"].indexOf(
                                        (err as NodeJS.ErrnoException).code as string
                                    ) !== -1 &&
                                    retries < opt.maxRetries
                                ) {
                                    retries++;
                                    if ((err as NodeJS.ErrnoException).code === "EPERM") {
                                        /* istanbul ignore next */
                                        return chmod(path, 0o666, (errChMod: NodeJS.ErrnoException | null) => {
                                            if (errChMod && (errChMod as NodeJS.ErrnoException).code === "ENOENT") {
                                                return cb(null);
                                            }
                                            return setTimeout(retry, retries * opt.retryDelay);
                                        });
                                    } else {
                                        return setTimeout(retry, retries * opt.retryDelay);
                                    }
                                } else if (retries >= opt.maxRetries) {
                                    return cb(err);
                                }
                            }
                            cb(null);
                        });
                    }
                    retry();
                }
            }
        });
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.rmdir, fs, [path, options, callback]);
    }
}

/**
 * Synchronous [`rmdir(2)`](http://man7.org/linux/man-pages/man2/rmdir.2.html). Returns `undefined`.
 *
 * Using `fs.rmdirSync()` on a file (not a directory) results in an `ENOENT` error
 * on Windows and an `ENOTDIR` error on POSIX.
 *
 * To get a behavior similar to the `rm -rf` Unix command, use {@link rmSync} with options `{ recursive: true, force: true }`.
 */
export function rmdirSync(path: NodeFs.PathLike, options?: NodeFs.RmDirOptions): void {
    if (!IgnorePatch) {
        const opt: Required<NodeFs.RmDirOptions> = {
            maxRetries: getObjectOption(options, "maxRetries", 0),
            retryDelay: getObjectOption(options, "retryDelay", 100),
            recursive: getObjectOption(options, "recursive", false),
        };
        if ("maxBusyTries" in ((options || {}) as NodeFs.RmDirOptions)) {
            /* istanbul ignore next */
            opt.maxRetries = (options as unknown as Record<string, number>)["maxBusyTries"];
        }

        const stats = statSync(path);

        /* istanbul ignore next */
        if (!stats.isDirectory()) {
            const e: NodeJS.ErrnoException = new Error(`'${path}' is not a directory.`);
            e.code = IsWindows ? "ENOENT" : "ENOTDIR";
            throw e;
        } else {
            if ("recursive" in opt && opt.recursive) {
                return _rm.rmSync(path, { force: true, recursive: true });
            } else {
                const tries = opt.maxRetries + 1;
                for (let i = 1; i <= tries; i++) {
                    try {
                        fs.rmdirSync(path, opt);
                    } catch (err) {
                        // Only sleep if this is not the last try, and the delay is greater
                        // than zero, and an error was encountered that warrants a retry.
                        /* istanbul ignore next */
                        if (
                            ["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"].indexOf(
                                (err as NodeJS.ErrnoException).code as string
                            ) !== -1 &&
                            i < tries &&
                            opt.retryDelay > 0
                        ) {
                            //poor sleeping
                            const stop = Date.now() + i * opt.retryDelay;
                            while (stop < Date.now()) {}
                            //sleep(i * options.retryDelay);
                        } else if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                            // The file is already gone.
                            return;
                        } else if (i === tries) {
                            throw err;
                        }
                    }
                }
            }
        }
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.rmdirSync, fs, [path, options]);
    }
}

/** @internal*/
function statFix(
    this: typeof NodeFs,
    orig: CallableFunction,
    path: NodeFs.PathLike | number,
    options: unknown,
    callback: CallableFunction
): void {
    if (!IgnorePatch) {
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        if (Type.isUndefined(options) && NumberUtil.nodeVersionGTE("10.0.0") && NumberUtil.nodeVersionLT("11")) {
            /* istanbul ignore next */
            options = { BigInt: false };
        }
        return Reflect.apply(orig, this, [
            path,
            options,
            (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats | NodeFs.BigIntStats) => {
                if (stats) {
                    if (stats.uid < 0) {
                        (stats.uid as number) += 0x100000000;
                    }
                    if (stats.gid < 0) {
                        (stats.gid as number) += 0x100000000;
                    }
                }
                callback(err, stats);
            },
        ]);
    } else {
        /* istanbul ignore next */
        Reflect.apply(orig, fs, [path, options, callback]);
    }
}

/** @internal*/
function statFixSync(
    orig: CallableFunction,
    path: NodeFs.PathLike | number,
    options?: unknown
): NodeFs.Stats | NodeFs.BigIntStats | undefined {
    if (!IgnorePatch) {
        // Older versions of Node erroneously returned signed integers for
        // uid + gid.
        if (Type.isUndefined(options) && NumberUtil.nodeVersionGTE("10.0.0") && NumberUtil.nodeVersionLT("11")) {
            /* istanbul ignore next */
            options = { BigInt: false };
        }
        const stats = Reflect.apply(orig, fs, [path, options]);
        if (stats.uid < 0) {
            (stats.uid as number) += 0x100000000;
        }
        if (stats.gid < 0) {
            (stats.gid as number) += 0x100000000;
        }
        return stats;
    } else {
        /* istanbul ignore next */
        return Reflect.apply(orig, fs, [path, options]);
    }
}

/**
 * Asynchronous [`stat(2)`](http://man7.org/linux/man-pages/man2/stat.2.html). The callback gets two arguments `(err, stats)` where`stats` is an `fs.Stats` object.
 *
 * In case of an error, the `err.code` will be one of `Common System Errors`.
 *
 * Using `fs.stat()` to check for the existence of a file before calling`fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended.
 * Instead, user code should open/read/write the file directly and handle the
 * error raised if the file is not available.
 *
 * To check if a file exists without manipulating it afterwards, {@link access} is recommended.
 *
 * For example, given the following directory structure:
 *
 * ```text
 * - txtDir
 * -- file.txt
 * - app.js
 * ```
 *
 * The next program will check for the stats of the given paths:
 *
 * ```js
 * import { stat } from 'fs-extender';
 *
 * const pathsToCheck = ['./txtDir', './txtDir/file.txt'];
 *
 * for (let i = 0; i < pathsToCheck.length; i++) {
 *   stat(pathsToCheck[i], (err, stats) => {
 *     console.log(stats.isDirectory());
 *     console.log(stats);
 *   });
 * }
 * ```
 *
 * The resulting output will resemble:
 *
 * ```console
 * true
 * Stats {
 *   dev: 16777220,
 *   mode: 16877,
 *   nlink: 3,
 *   uid: 501,
 *   gid: 20,
 *   rdev: 0,
 *   blksize: 4096,
 *   ino: 14214262,
 *   size: 96,
 *   blocks: 0,
 *   atimeMs: 1561174653071.963,
 *   mtimeMs: 1561174614583.3518,
 *   ctimeMs: 1561174626623.5366,
 *   birthtimeMs: 1561174126937.2893,
 *   atime: 2019-06-22T03:37:33.072Z,
 *   mtime: 2019-06-22T03:36:54.583Z,
 *   ctime: 2019-06-22T03:37:06.624Z,
 *   birthtime: 2019-06-22T03:28:46.937Z
 * }
 * false
 * Stats {
 *   dev: 16777220,
 *   mode: 33188,
 *   nlink: 1,
 *   uid: 501,
 *   gid: 20,
 *   rdev: 0,
 *   blksize: 4096,
 *   ino: 14214074,
 *   size: 8,
 *   blocks: 8,
 *   atimeMs: 1561174616618.8555,
 *   mtimeMs: 1561174614584,
 *   ctimeMs: 1561174614583.8145,
 *   birthtimeMs: 1561174007710.7478,
 *   atime: 2019-06-22T03:36:56.619Z,
 *   mtime: 2019-06-22T03:36:54.584Z,
 *   ctime: 2019-06-22T03:36:54.584Z,
 *   birthtime: 2019-06-22T03:26:47.711Z
 * }
 * ```
 */
export function stat(
    path: NodeFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
): void;
export function stat(
    path: NodeFs.PathLike,
    options: (NodeFs.StatOptions & { bigint?: false | undefined }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
): void;
export function stat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions & { bigint: true },
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.BigIntStats) => void
): void;
export function stat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats | NodeFs.BigIntStats) => void
): void;
export function stat(path: NodeFs.PathLike, options: unknown, callback?: unknown): void {
    if (Type.isFunction(options)) {
        callback = options;
        options = undefined;
    }
    Reflect.apply(statFix, fs, [fs.stat, path, options, callback]);
}

/**
 * Invokes the callback with the `fs.Stats` for the file descriptor.
 *
 * See the POSIX [`fstat(2)`](http://man7.org/linux/man-pages/man2/fstat.2.html) documentation for more detail.
 */
export function fstat(fd: number, callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void): void;
export function fstat(
    fd: number,
    options: (NodeFs.StatOptions & { bigint?: false | undefined }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
): void;
export function fstat(
    fd: number,
    options: NodeFs.StatOptions & { bigint: true },
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.BigIntStats) => void
): void;
export function fstat(
    fd: number,
    options: NodeFs.StatOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats | NodeFs.BigIntStats) => void
): void;
export function fstat(fd: number, options: unknown, callback?: unknown): void {
    /* istanbul ignore next */
    if (Type.isFunction(options)) {
        callback = options;
        options = undefined;
    }
    /* istanbul ignore next */
    return Reflect.apply(statFix, fs, [fs.fstat, fd, options, callback as CallableFunction]);
}

/**
 * Retrieves the `fs.Stats` for the symbolic link referred to by the path.
 * The callback gets two arguments `(err, stats)` where `stats` is a `fs.Stats` object. `lstat()` is identical to `stat()`, except that if `path` is a symbolic
 * link, then the link itself is stat-ed, not the file that it refers to.
 *
 * See the POSIX [`lstat(2)`](http://man7.org/linux/man-pages/man2/lstat.2.html) documentation for more details.
 */
export function lstat(
    path: NodeFs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
): void;
export function lstat(
    path: NodeFs.PathLike,
    options: (NodeFs.StatOptions & { bigint?: false | undefined }) | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
): void;
export function lstat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions & { bigint: true },
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.BigIntStats) => void
): void;
export function lstat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions | undefined,
    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats | NodeFs.BigIntStats) => void
): void;
export function lstat(path: NodeFs.PathLike, options: unknown, callback?: unknown): void {
    if (Type.isFunction(options)) {
        callback = options;
        options = undefined;
    }
    return Reflect.apply(statFix, fs, [fs.lstat, path, options, callback]);
}

/**
 * Synchronous stat(2) - Get file status.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function statSync(path: NodeFs.PathLike, options?: undefined): NodeFs.Stats;
export function statSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions & {
        bigint?: false | undefined;
        throwIfNoEntry: false;
    }
): NodeFs.Stats | undefined;
export function statSync(
    path: NodeFs.PathLike,
    options: NodeFs.StatSyncOptions & { bigint: true; throwIfNoEntry: false }
): NodeFs.BigIntStats | undefined;
export function statSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions & { bigint?: false | undefined }
): NodeFs.Stats;
export function statSync(path: NodeFs.PathLike, options: NodeFs.StatSyncOptions & { bigint: true }): NodeFs.BigIntStats;
export function statSync(
    path: NodeFs.PathLike,
    options: NodeFs.StatSyncOptions & {
        bigint: boolean;
        throwIfNoEntry?: false | undefined;
    }
): NodeFs.Stats | NodeFs.BigIntStats;
export function statSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions
): NodeFs.Stats | NodeFs.BigIntStats | undefined;
export function statSync(path: NodeFs.PathLike, options?: unknown): NodeFs.Stats | NodeFs.BigIntStats | undefined {
    return Reflect.apply(statFixSync, fs, [fs.statSync, path, options]);
}

/**
 * Synchronous fstat(2) - Get file status.
 * @param fd A file descriptor.
 */
export function fstatSync(fd: number, options?: NodeFs.StatOptions & { bigint?: false | undefined }): NodeFs.Stats;
export function fstatSync(fd: number, options: NodeFs.StatOptions & { bigint: true }): NodeFs.BigIntStats;
export function fstatSync(fd: number, options?: NodeFs.StatOptions): NodeFs.Stats | NodeFs.BigIntStats;
export function fstatSync(fd: number, options?: unknown): NodeFs.Stats | NodeFs.BigIntStats | undefined {
    /* istanbul ignore next */
    return Reflect.apply(statFixSync, fs, [fs.fstatSync, fd, options]);
}

/**
 * Synchronous lstat(2) - Get file status. Does not dereference symbolic links.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function lstatSync(path: NodeFs.PathLike, options?: undefined): NodeFs.Stats;
export function lstatSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions & {
        bigint?: false | undefined;
        throwIfNoEntry: false;
    }
): NodeFs.Stats | undefined;
export function lstatSync(
    path: NodeFs.PathLike,
    options: NodeFs.StatSyncOptions & { bigint: true; throwIfNoEntry: false }
): NodeFs.BigIntStats | undefined;
export function lstatSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions & { bigint?: false | undefined }
): NodeFs.Stats;
export function lstatSync(
    path: NodeFs.PathLike,
    options: NodeFs.StatSyncOptions & { bigint: true }
): NodeFs.BigIntStats;
export function lstatSync(
    path: NodeFs.PathLike,
    options: NodeFs.StatSyncOptions & {
        bigint: boolean;
        throwIfNoEntry?: false | undefined;
    }
): NodeFs.Stats | NodeFs.BigIntStats;
export function lstatSync(
    path: NodeFs.PathLike,
    options?: NodeFs.StatSyncOptions
): NodeFs.Stats | NodeFs.BigIntStats | undefined;
export function lstatSync(path: NodeFs.PathLike, options?: unknown): NodeFs.Stats | NodeFs.BigIntStats | undefined {
    return Reflect.apply(statFixSync, fs, [fs.lstatSync, path, options]);
}

/**
 * Creates the link called `path` pointing to `target`. No arguments other than a
 * possible exception are given to the completion callback.
 *
 * See the POSIX [`symlink(2)`](http://man7.org/linux/man-pages/man2/symlink.2.html) documentation for more details.
 *
 * The `type` argument is only available on Windows and ignored on other platforms.
 * It can be set to `'dir'`, `'file'`, or `'junction'`. If the `type` argument is
 * not set, Node.js will autodetect `target` type and use `'file'` or `'dir'`. If
 * the `target` does not exist, `'file'` will be used. Windows junction points
 * require the destination path to be absolute. When using `'junction'`, the`target` argument will automatically be normalized to absolute path.
 *
 * Relative targets are relative to the link’s parent directory.
 *
 * ```js
 * import { symlink } from 'fs';
 *
 * symlink('./mew', './example/mewtwo', callback);
 * ```
 *
 * The above example creates a symbolic link `mewtwo` in the `example` which points
 * to `mew` in the same directory:
 *
 * ```bash
 * $ tree example/
 * example/
 * ├── mew
 * └── mewtwo -> ./mew
 * ```
 * @since v0.1.31
 */
export function symlink(
    target: NodeFs.PathLike,
    path: NodeFs.PathLike,
    type: "dir" | "file" | "junction" | undefined | null,
    callback: NodeFs.NoParamCallback
): void;
/**
 * Asynchronous symlink(2) - Create a new symbolic link to an existing file.
 * @param target A path to an existing file. If a URL is provided, it must use the `file:` protocol.
 * @param path A path to the new symlink. If a URL is provided, it must use the `file:` protocol.
 */
export function symlink(target: NodeFs.PathLike, path: NodeFs.PathLike, callback: NodeFs.NoParamCallback): void;
/* istanbul ignore next */
export function symlink(
    target: NodeFs.PathLike,
    path: NodeFs.PathLike,
    type: unknown,
    callback?: NodeFs.NoParamCallback
): void {
    if (Type.isFunction(type)) {
        callback = type as NodeFs.NoParamCallback;
        type = null;
    }
    //this patch is only applied in node v12.0.0
    if (!IgnorePatch && Type.isNullOrUndefined(type) && IsWindows && NumberUtil.nodeVersionLT("12.0.0")) {
        const absoluteTarget = NodePath.resolve(path, "..", target);
        if (!Type.isUndefined(absoluteTarget)) {
            return Reflect.apply(fs.stat, fs, [
                absoluteTarget,
                (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => {
                    type = stats && stats.isDirectory() ? "dir" : "file";
                    Reflect.apply(fs.symlink, fs, [target, path, type, callback]);
                },
            ]);
        }
    }
    Reflect.apply(fs.symlink, fs, [target, path, type, callback]);
}
/**
 * Returns `undefined`.
 *
 * For detailed information, see the documentation of the asynchronous version of
 * this API: {@link symlink}.
 * @since v0.1.31
 */
/* istanbul ignore next */
export function symlinkSync(
    target: NodeFs.PathLike,
    path: NodeFs.PathLike,
    type?: "dir" | "file" | "junction" | null
): void {
    if (!IgnorePatch && Type.isNullOrUndefined(type) && IsWindows && NumberUtil.nodeVersionLT("12.0.0")) {
        const absoluteTarget = NodePath.resolve(path, "..", target);
        try {
            const stats = fs.statSync(absoluteTarget);
            type = stats.isDirectory() ? "dir" : "file";
        } catch (err) {}
    }
    return Reflect.apply(fs.symlinkSync, fs, [target, path, type]);
}

/**
 * Asynchronously removes a file or symbolic link. No arguments other than a
 * possible exception are given to the completion callback.
 *
 * ```js
 * import { unlink } from 'fs-extender';
 * // Assuming that 'path/file.txt' is a regular file.
 * unlink('path/file.txt', (err) => {
 *   if (err) throw err;
 *   console.log('path/file.txt was deleted');
 * });
 * ```
 *
 * `fs.unlink()` will not work on a directory, empty or otherwise. To remove a
 * directory, use {@link rmdir}.
 *
 * See the POSIX [`unlink(2)`](http://man7.org/linux/man-pages/man2/unlink.2.html) documentation for more details.
 */
export function unlink(path: NodeFs.PathLike, callback: NodeFs.NoParamCallback): void {
    if (!IgnorePatch) {
        const startTime = Date.now();
        let backOff = -10;
        const stopTime = startTime + MaxTimeout;
        function retry() {
            fs.unlink(path, (err: NodeJS.ErrnoException | null) => {
                if (err) {
                    if (err.code === "ENOENT") {
                        /* istanbul ignore next */
                        return callback(null);
                    } else if (["EBUSY", "EPERM"].indexOf(err.code as string) !== -1 && stopTime > Date.now()) {
                        /* istanbul ignore next */
                        if (err.code === "EPERM" && IsWindows) {
                            return chmod(path, 0o666, (errChmod: NodeJS.ErrnoException | null) => {
                                if (errChmod) {
                                    if (errChmod.code === "ENOENT") {
                                        return callback(null);
                                    }
                                    return callback(err);
                                }
                                retry();
                            });
                        } else {
                            setTimeout(retry, backOff);
                            if (backOff < 100) {
                                backOff += 10;
                            }
                        }
                    } else {
                        return callback(err);
                    }
                } else {
                    return callback(null);
                }
            });
        }
        retry();
    } else {
        /* istanbul ignore next */
        Reflect.apply(fs.unlink, fs, [path, callback]);
    }
}

/**
 * Synchronous [`unlink(2)`](http://man7.org/linux/man-pages/man2/unlink.2.html). Returns `undefined`.
 *
 *  **ATTENTION**: This function will block the event loop until the file is removed or timeout, use with care
 */
export function unlinkSync(path: NodeFs.PathLike): void {
    if (!IgnorePatch) {
        const startTime = Date.now();
        let backOff = -10;
        const stopTime = startTime + MaxTimeout;
        function retry(): void {
            try {
                fs.unlinkSync(path);
            } catch (er) {
                const err = er as NodeJS.ErrnoException;
                if (err.code === "ENOENT") {
                    /* istanbul ignore next */
                    return;
                } else if (["EBUSY", "EPERM"].indexOf(err.code as string) !== -1 && stopTime > Date.now()) {
                    /* istanbul ignore next */
                    if (err.code === "EPERM" && IsWindows) {
                        try {
                            chmodSync(path, 0o666);
                        } catch (errChmod) {
                            if ((errChmod as NodeJS.ErrnoException).code === "ENOENT") {
                                return;
                            }
                            throw err;
                        }
                        return retry();
                    } else {
                        if (backOff < 100) {
                            backOff += 10;
                        }
                        const waitUntil = Date.now() + backOff;
                        while (waitUntil < Date.now()) {}
                        return retry();
                    }
                } else {
                    throw err;
                }
            }
        }
        retry();
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.unlinkSync, fs, [path]);
    }
}

/**
 * When `file` is a filename, asynchronously writes data to the file, replacing the
 * file if it already exists. `data` can be a string or a buffer.
 *
 * When `file` is a file descriptor, the behavior is similar to calling`fs.write()` directly (which is recommended). See the notes below on using
 * a file descriptor.
 *
 * The `encoding` option is ignored if `data` is a buffer.
 *
 * The `mode` option only affects the newly created file. See {@link open} for more details.
 *
 * If `data` is a plain object, it must have an own (not inherited) `toString`function property.
 *
 * ```js
 * import { writeFile } from 'fs-extender';
 * import { Buffer } from 'buffer';
 *
 * const data = new Uint8Array(Buffer.from('Hello Node.js'));
 * writeFile('message.txt', data, (err) => {
 *   if (err) throw err;
 *   console.log('The file has been saved!');
 * });
 * ```
 *
 * If `options` is a string, then it specifies the encoding:
 *
 * ```js
 * import { writeFile } from 'fs-extender';
 *
 * writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
 * ```
 *
 * It is unsafe to use `fs.writeFile()` multiple times on the same file without
 * waiting for the callback. For this scenario, {@link createWriteStream} is
 * recommended.
 *
 * Similarly to `fs.readFile` \- `fs.writeFile` is a convenience method that
 * performs multiple `write` calls internally to write the buffer passed to it.
 * For performance sensitive code consider using {@link createWriteStream}.
 *
 * It is possible to use an `AbortSignal` to cancel an `fs.writeFile()`.
 * Cancelation is "best effort", and some amount of data is likely still
 * to be written.
 *
 * ```js
 * import { writeFile } from 'fs-extender';
 * import { Buffer } from 'buffer';
 *
 * const controller = new AbortController();
 * const { signal } = controller;
 * const data = new Uint8Array(Buffer.from('Hello Node.js'));
 * writeFile('message.txt', data, { signal }, (err) => {
 *   // When a request is aborted - the callback is called with an AbortError
 * });
 * // When the request should be aborted
 * controller.abort();
 * ```
 *
 * Aborting an ongoing request does not abort individual operating
 * system requests but rather the internal buffering `fs.writeFile` performs.
 * @param file filename or file descriptor
 */
export function writeFile(
    file: NodeFs.PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    options: NodeFs.WriteFileOptions,
    callback: NodeFs.NoParamCallback
): void;
/**
 * Asynchronously writes data to a file, replacing the file if it already exists.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 */
export function writeFile(
    path: NodeFs.PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    callback: NodeFs.NoParamCallback
): void;
export function writeFile(
    path: NodeFs.PathLike | number,
    data: string | NodeJS.ArrayBufferView,
    options: unknown,
    callback?: NodeFs.NoParamCallback
): void {
    if (!IgnorePatch) {
        if (Type.isFunction(options)) {
            callback = options as NodeFs.NoParamCallback;
            options = null;
        }
        function fsWriteFile(
            path: NodeFs.PathLike | number,
            data: string | NodeJS.ArrayBufferView,
            options: NodeFs.WriteFileOptions,
            callback: NodeFs.NoParamCallback,
            startTime?: number
        ) {
            return fs.writeFile(path, data, options, (...args: Array<unknown>): void => {
                errorEnqueueOrCallback(fsWriteFile, [path, data, options, callback], args, callback, startTime);
            });
        }
        return fsWriteFile(path, data, options as NodeFs.WriteFileOptions, callback as NodeFs.NoParamCallback);
    } else {
        /* istanbul ignore next */
        return Reflect.apply(fs.writeFile, fs, [path, data, options, callback]);
    }
}

export {
    ReadStream,
    WriteStream,
    createReadStream,
    createWriteStream,
    ReadStreamOptions,
    StreamOptions,
} from "./patchStream";

export * as promises from "./promises";

export {
    exists,
    existAccess,
    existAccessSync,
    statIsDirectory,
    statIsDirectorySync,
    statIsFile,
    statIsFileSync,
    statIsSymbolicLink,
    statIsSymbolicLinkSync,
    isEmpty,
    isEmptySync,
} from "./addins";
