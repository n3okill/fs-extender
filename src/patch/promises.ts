import * as NodeFs from "fs";
const fsAux = process.env["FS_EXTENDER_FS_OVERRIDE"] ? require(process.env["FS_EXTENDER_FS_OVERRIDE"]) : require("fs");
import { promisify } from "util";
import * as fs from "./patch.js";
import * as _rm from "../rm/index.js";
import * as _copy from "../copy/index.js";

Object.keys(fsAux.promises).forEach((key) => {
    module.exports[key] = fsAux.promises[key];
});

/**
 * Tests a user's permissions for the file or directory specified by `path`.
 * The `mode` argument is an optional integer that specifies the accessibility
 * checks to be performed. Check `File access constants` for possible values
 * of `mode`. It is possible to create a mask consisting of the bitwise OR of
 * two or more values (e.g. `fs.constants.W_OK | fs.constants.R_OK`).
 *
 * If the accessibility check is successful, the promise is resolved with no
 * value. If any of the accessibility checks fail, the promise is rejected
 * with an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object.
 * The following example checks if the file`/etc/passwd` can be read and
 * written by the current process.
 *
 * ```js
 * import * as fs from "fs-extender";
 *
 * try {
 *   await fs.promises.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
 *   console.log('can access');
 * } catch {
 *   console.error('cannot access');
 * }
 * ```
 *
 * Using `fs.promises.access()` to check for the accessibility of a file before
 * calling `fs.promises.open()` is not recommended. Doing so introduces a race
 * condition, since other processes may change the file's state between the two
 * calls. Instead, user code should open/read/write the file directly and handle
 * the error raised if the file is not accessible.
 * @param [mode=fs.constants.F_OK]
 * @return Fulfills with `undefined` upon success.
 */
export function access(path: NodeFs.PathLike, mode?: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.access), fs, [path, mode]);
}

/**
 * Asynchronously append data to a file, creating the file if it does not exist.
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
 * If `encoding` is not supplied, the default of `'utf8'` is used.
 * If `mode` is not supplied, the default of `0o666` is used.
 * If `mode` is a string, it is parsed as an octal integer.
 * If `flag` is not supplied, the default of `'a'` is used.
 */
export function appendFile(
    file: NodeFs.PathOrFileDescriptor,
    data: string | Uint8Array,
    options?: NodeFs.WriteFileOptions
): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.appendFile), fs, [file, data, options]);
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
 * import * as fs from "fs-extender";
 *
 * // destination.txt will be created or overwritten by default.
 * fs.promises.copyFile('source.txt', 'destination.txt');
 *
 * // By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
 * fs.promises.copyFile('source.txt', 'destination.txt', constants.COPYFILE_EXCL, callback);
 * ```
 * @param src source filename to copy
 * @param dest destination filename of the copy operation
 * @param [mode=0] modifiers for copy operation.
 */
export function copyFile(src: NodeFs.PathLike, dst: NodeFs.PathLike, mode?: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.copyFile), fs, [src, dst, mode]);
}

/**
 * Asynchronous chown(2) - Change ownership of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function chown(path: NodeFs.PathLike, uid: number, gid: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.chown), fs, [path, uid, gid]);
}

/**
 * Asynchronous fchown(2) - Change ownership of a file.
 * @param fd A file descriptor.
 */
export function fchown(fd: number, uid: number, gid: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.fchown), fs, [fd, uid, gid]);
}

/**
 * Asynchronous lchown(2) - Change ownership of a file. Does not dereference symbolic links.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function lchown(path: NodeFs.PathLike, uid: number, gid: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.lchown), fs, [path, uid, gid]);
}

/**
 * Asynchronous chmod(2) - Change permissions of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
 */
export function chmod(path: NodeFs.PathLike, mode: NodeFs.Mode): Promise<void> {
    return Reflect.apply(promisify(fs.chmod), fs, [path, mode]);
}

/**
 * Asynchronous fchmod(2) - Change permissions of a file.
 * @param fd A file descriptor.
 * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
 */
export function fchmod(fd: number, mode: NodeFs.Mode): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.fchmod), fs, [fd, mode]);
}

/**
 * Asynchronous lchmod(2) - Change permissions of a file. Does not dereference symbolic links.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param mode A file mode. If a string is passed, it is parsed as an octal integer.
 */
export function lchomd(path: NodeFs.PathLike, mode: NodeFs.Mode): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.lchmod), fs, [path, mode]);
}

/**
 * Asynchronously copies the entire directory structure from `src` to `dest`,
 * including subdirectories and files.
 *
 * When copying a directory to another directory, globs are not supported and
 * behavior is similar to `cp dir1/ dir2/`.
 * if cp function doesn't exist in fs.promises then the copy module will be used
 * this is normalized so that there's always an option to copy files without failing
 * because cp was introduced as experimental at node v16.7.0
 * @param src source path to copy.
 * @param dest destination path to copy to.
 * @return Fulfills with `undefined` upon success.
 */
export function cp(
    source: NodeFs.PathLike,
    destination: NodeFs.PathLike,
    opts?: _copy.CopyOptions<string | Buffer>
): Promise<void> {
    /* istanbul ignore next */
    if ("promises" in fsAux && "cp" in fsAux.promises) {
        return Reflect.apply(fsAux.promises.cp, fsAux, [source, destination, opts]);
    } else {
        return Reflect.apply(_copy.promises.copy, fs, [source, destination, opts]);
    }
}

/**
 * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 */
export function exists(path: NodeFs.PathLike): Promise<boolean> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.exists), fs, [path]);
}

/**
 * Check if it is possible to access the `path` object
 * `callback` gets 2 arguments `(err, exist:boolean)`
 * @param path fs.PathLike
 * @param mode
 */
export function existAccess(path: NodeFs.PathLike, mode?: number | undefined): Promise<boolean> {
    return Reflect.apply(promisify(fs.existAccess), fs, [path, mode]);
}

/**
 * Check if given path is empty, if it's a folder it will use
 * `readdir` and check the number of returing items,
 * if it's another thing it will return the `size === 0`.
 * Will throw any error that happens while checking
 */
export function isEmpty(
    path: NodeFs.PathLike,
    options: { dereference?: boolean } = { dereference: false }
): Promise<boolean> {
    return Reflect.apply(promisify(fs.isEmpty), fs, [path, options]);
}

/**
 * Creates a new link from the `existingPath` to the `newPath`.
 * See the POSIX [`link(2)`](http://man7.org/linux/man-pages/man2/link.2.html) documentation for more detail.
 * @return Fulfills with `undefined` upon success.
 */
export function link(existingPath: NodeFs.PathLike, newPath: NodeFs.PathLike): Promise<void> {
    return Reflect.apply(promisify(fs.link), fs, [existingPath, newPath]);
}

/**
 * Changes the access and modification times of a file in the same way as `fs.promises.utimes()`,
 * with the difference that if the path refers to a symbolic link, then the link is not
 * dereferenced: instead, the timestamps of the symbolic link itself are changed.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param atime The last access time. If a string is provided, it will be coerced to number.
 * @param mtime The last modified time. If a string is provided, it will be coerced to number.
 */
export function lutimes(path: NodeFs.PathLike, atime: NodeFs.TimeLike, mtime: NodeFs.TimeLike): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.lutimes), fs, [path, atime, mtime]);
}

/**
 * Asynchronously creates a directory.
 *
 * The optional `options` argument can be an integer specifying `mode` (permission
 * and sticky bits), or an object with a `mode` property and a `recursive`property
 * indicating whether parent directories should be created. Calling`fs.promises.mkdir()` when `path` is a directory
 * that exists results in a rejection only when `recursive` is false.
 * @return Upon success, fulfills with `undefined` if `recursive` is `false`, or the first directory path created if `recursive` is `true`.
 */
export function mkdir(
    path: NodeFs.PathLike,
    options: NodeFs.MakeDirectoryOptions & { recursive: true }
): Promise<string | undefined>;
/**
 * Asynchronous mkdir(2) - create a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
 * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
 */
export function mkdir(
    path: NodeFs.PathLike,
    options?: NodeFs.Mode | (NodeFs.MakeDirectoryOptions & { recursive?: false | undefined }) | null
): Promise<void>;
/**
 * Asynchronous mkdir(2) - create a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
 * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
 */
export function mkdir(
    path: NodeFs.PathLike,
    options?: NodeFs.Mode | NodeFs.MakeDirectoryOptions | null
): Promise<string | undefined>;
export function mkdir(path: NodeFs.PathLike, options?: unknown): unknown {
    return Reflect.apply(promisify(fs.mkdir), fs, [path, options]);
}

/**
 * Creates a unique temporary directory. A unique directory name is generated by
 * appending six random characters to the end of the provided `prefix`. Due to
 * platform inconsistencies, avoid trailing `X` characters in `prefix`. Some
 * platforms, notably the BSDs, can return more than six random characters, and
 * replace trailing `X` characters in `prefix` with random characters.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use.
 *
 * ```js
 * import * as fs from 'fs-extender';
 *
 * try {
 *   await fs.promises.mkdtemp(path.join(os.tmpdir(), 'foo-'));
 * } catch (err) {
 *   console.error(err);
 * }
 * ```
 *
 * The `fs.promises.mkdtemp()` method will append the six randomly selected
 * characters directly to the `prefix` string. For instance, given a directory`/tmp`,
 * if the intention is to create a temporary directory _within_`/tmp`, the`prefix` must end with a trailing
 * platform-specific path separator
 * (`require('path').sep`).
 * @return Fulfills with a string containing the filesystem path of the newly created temporary directory.
 */
export function mkdtemp(
    prefix: string,
    options?: NodeFs.ObjectEncodingOptions | BufferEncoding | null
): Promise<string>;
/**
 * Asynchronously creates a unique temporary directory.
 * Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function mkdtemp(prefix: string, options: NodeFs.BufferEncodingOption): Promise<Buffer>;
/**
 * Asynchronously creates a unique temporary directory.
 * Generates six random characters to be appended behind a required `prefix` to create a unique temporary directory.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function mkdtemp(
    prefix: string,
    options?: NodeFs.ObjectEncodingOptions | BufferEncoding | null
): Promise<string | Buffer>;
export function mkdtemp(prefix: string, options?: unknown): unknown {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.mkdtemp), fs, [prefix, options]);
}

/**
 * Opens a `FileHandle`.
 *
 * Refer to the POSIX [`open(2)`](http://man7.org/linux/man-pages/man2/open.2.html) documentation for more detail.
 *
 * Some characters (`< > : " / \ | ? *`) are reserved under Windows as documented
 * by [Naming Files, Paths, and Namespaces](https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file). Under NTFS, if the filename contains
 * a colon, Node.js will open a file system stream, as described by [this MSDN page](https://docs.microsoft.com/en-us/windows/desktop/FileIO/using-streams).
 * @param [flags='r'] See `support of file system `flags``.
 * @param [mode=0o666] Sets the file mode (permission and sticky bits) if the file is created.
 * @return Fulfills with a {FileHandle} object.
 */
export function open(
    path: NodeFs.PathLike,
    flags: string | number,
    mode?: NodeFs.Mode
): Promise<NodeFs.promises.FileHandle> {
    return Reflect.apply(fsAux.promises.open, fsAux, [path, flags, mode]);
}

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
    position: number | null
): Promise<{ bytesRead: number; buffer: TBuffer }> {
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
        fs.read(
            fd,
            buffer,
            offset,
            length,
            position,
            (err: NodeJS.ErrnoException | null, bytesRead: number, buffer: TBuffer) => {
                if (err) {
                    return reject(err);
                }
                resolve({ bytesRead, buffer });
            }
        );
    });
}

/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdir(
    path: NodeFs.PathLike,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null
): Promise<string[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdir(
    path: NodeFs.PathLike,
    options: "buffer" | { encoding: "buffer"; withFileTypes?: false | undefined }
): Promise<Buffer[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readdir(
    path: NodeFs.PathLike,
    options?: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | null
): Promise<string[] | Buffer[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent
 */
export function readdir(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true }
): Promise<NodeFs.Dirent[]>;
export function readdir(path: NodeFs.PathLike, options: unknown): Promise<string[] | Buffer[] | NodeFs.Dirent[]> {
    return Reflect.apply(promisify(fs.readdir), fs, [path, options]);
}

/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDir(
    path: NodeFs.PathLike,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false | undefined } | BufferEncoding | null
): Promise<string[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDir(
    path: NodeFs.PathLike,
    options: "buffer" | { encoding: "buffer"; withFileTypes?: false | undefined }
): Promise<Buffer[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readDir(
    path: NodeFs.PathLike,
    options?: (NodeFs.ObjectEncodingOptions & { withFileTypes?: false | undefined }) | BufferEncoding | null
): Promise<string[] | Buffer[]>;
/**
 * Asynchronous readdir(3) - read a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options If called with `withFileTypes: true` the result data will be an array of Dirent
 */
export function readDir(
    path: NodeFs.PathLike,
    options: NodeFs.ObjectEncodingOptions & { withFileTypes: true }
): Promise<NodeFs.Dirent[]>;
export function readDir(path: NodeFs.PathLike, options: unknown): Promise<string[] | Buffer[] | NodeFs.Dirent[]> {
    /* istanbul ignore next */
    return readdir(path, options as never);
}

/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param options An object that may contain an optional flag.
 * If a flag is not provided, it defaults to `'r'`.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options?: { encoding?: null | undefined; flag?: string | undefined } | null
): Promise<Buffer>;
/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
 * If a flag is not provided, it defaults to `'r'`.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options: { encoding: BufferEncoding; flag?: string | undefined } | BufferEncoding
): Promise<string>;
/**
 * Asynchronously reads the entire contents of a file.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param options Either the encoding for the result, or an object that contains the encoding and an optional flag.
 * If a flag is not provided, it defaults to `'r'`.
 */
export function readFile(
    path: NodeFs.PathOrFileDescriptor,
    options?: (NodeFs.ObjectEncodingOptions & { flag?: string | undefined }) | BufferEncoding | null
): Promise<string | Buffer>;
export function readFile(path: NodeFs.PathOrFileDescriptor, options?: unknown): Promise<string | Buffer> {
    return Reflect.apply(promisify(fs.readFile), fs, [path, options]);
}

/**
 * Reads the contents of the symbolic link referred to by `path`.
 * See the POSIX [`readlink(2)`](http://man7.org/linux/man-pages/man2/readlink.2.html) documentation for more detail. The promise is
 * resolved with the`linkString` upon success.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the link path returned. If the `encoding` is set to `'buffer'`, the link path
 * returned will be passed as a `Buffer` object.
 * @return Fulfills with the `linkString` upon success.
 */
export function readlink(
    path: NodeFs.PathLike,
    options?: NodeFs.ObjectEncodingOptions | BufferEncoding | null
): Promise<string>;
/**
 * Asynchronous readlink(2) - read value of a symbolic link.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readlink(path: NodeFs.PathLike, options: NodeFs.BufferEncodingOption): Promise<Buffer>;
/**
 * Asynchronous readlink(2) - read value of a symbolic link.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function readlink(
    path: NodeFs.PathLike,
    options?: NodeFs.ObjectEncodingOptions | string | null
): Promise<string | Buffer>;
export function readlink(path: NodeFs.PathLike, options?: unknown): unknown {
    return Reflect.apply(promisify(fs.readlink), fs, [path, options]);
}

/**
 * Determines the actual location of `path` using the same semantics as the`fs.realpath.native()` function.
 *
 * Only paths that can be converted to UTF8 strings are supported.
 *
 * The optional `options` argument can be a string specifying an encoding, or an
 * object with an `encoding` property specifying the character encoding to use for
 * the path. If the `encoding` is set to `'buffer'`, the path returned will be
 * passed as a `Buffer` object.
 *
 * On Linux, when Node.js is linked against musl libc, the procfs file system must
 * be mounted on `/proc` in order for this function to work. Glibc does not have
 * this restriction.
 * @return Fulfills with the resolved path upon success.
 */
export function realpath(
    path: NodeFs.PathLike,
    options?: NodeFs.ObjectEncodingOptions | BufferEncoding | null
): Promise<string>;
/**
 * Asynchronous realpath(3) - return the canonicalized absolute pathname.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function realpath(path: NodeFs.PathLike, options: NodeFs.BufferEncodingOption): Promise<Buffer>;
/**
 * Asynchronous realpath(3) - return the canonicalized absolute pathname.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options The encoding (or an object specifying the encoding), used as the encoding of the result. If not provided, `'utf8'` is used.
 */
export function realpath(
    path: NodeFs.PathLike,
    options?: NodeFs.ObjectEncodingOptions | BufferEncoding | null
): Promise<string | Buffer>;
export function realpath(path: NodeFs.PathLike, options?: unknown): unknown {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.realpath), fs, [path, options]);
}

/**
 * Asynchronous rename(2) - Change the name or location of a file or directory.
 * @param oldPath A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * @param newPath A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 */
export function rename(oldPath: NodeFs.PathLike, newPath: NodeFs.PathLike): Promise<void> {
    return Reflect.apply(promisify(fs.rename), fs, [oldPath, newPath]);
}

/**
 * Removes files and directories (modeled on the standard POSIX `rm` utility).
 * if rm method doesn't exist in fs.promises, the rm method will be used instead
 * @return Fulfills with `undefined` upon success.
 */
export function rm(path: NodeFs.PathLike, options?: NodeFs.RmOptions): Promise<void> {
    /* istanbul ignore next */
    if ("promises" in fsAux && "rm" in fsAux.promises) {
        return Reflect.apply(fsAux.promises.rm, fsAux, [path, options]);
    } else {
        return Reflect.apply(_rm.promises.rm, fs, [path, options]);
    }
}

/**
 * Removes the directory identified by `path`.
 *
 * Using `fsPromises.rmdir()` on a file (not a directory) results in the
 * promise being rejected with an `ENOENT` error on Windows and an `ENOTDIR`error on POSIX.
 *
 * To get a behavior similar to the `rm -rf` Unix command, use `fsPromises.rm()` with options `{ recursive: true, force: true }`.
 * @return Fulfills with `undefined` upon success.
 */
export function rmdir(path: NodeFs.PathLike, options?: NodeFs.RmDirOptions): Promise<void> {
    return Reflect.apply(promisify(fs.rmdir), fs, [path, options]);
}

/**
 * Asynchronous stat(2) - Get file status.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function stat(
    path: NodeFs.PathLike,
    options?: NodeFs.StatOptions & { bigint?: false | undefined }
): Promise<NodeFs.Stats>;
export function stat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions & { bigint: true }
): Promise<NodeFs.BigIntStats>;
export function stat(path: NodeFs.PathLike, options?: NodeFs.StatOptions): Promise<NodeFs.Stats | NodeFs.BigIntStats>;
export function stat(path: NodeFs.PathLike, options?: unknown): Promise<NodeFs.Stats | NodeFs.BigIntStats> {
    return Reflect.apply(promisify(fs.stat), fs, [path, options]);
}

/**
 * Asynchronous fstat(2) - Get file status.
 * @param fd A file descriptor.
 */
export function fstat(fd: number, options?: NodeFs.StatOptions & { bigint?: false | undefined }): Promise<NodeFs.Stats>;
export function fstat(fd: number, options: NodeFs.StatOptions & { bigint: true }): Promise<NodeFs.BigIntStats>;
export function fstat(fd: number, options?: NodeFs.StatOptions): Promise<NodeFs.Stats | NodeFs.BigIntStats>;
export function fstat(fd: number, options?: unknown): Promise<NodeFs.Stats | NodeFs.BigIntStats> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.fstat), fs, [fd, options]);
}

/**
 * Asynchronous lstat(2) - Get file status. Does not dereference symbolic links.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export function lstat(
    path: NodeFs.PathLike,
    options?: NodeFs.StatOptions & { bigint?: false | undefined }
): Promise<NodeFs.Stats>;
export function lstat(
    path: NodeFs.PathLike,
    options: NodeFs.StatOptions & { bigint: true }
): Promise<NodeFs.BigIntStats>;
export function lstat(path: NodeFs.PathLike, options?: NodeFs.StatOptions): Promise<NodeFs.Stats | NodeFs.BigIntStats>;
export function lstat(path: NodeFs.PathLike, options?: unknown): Promise<NodeFs.Stats | NodeFs.BigIntStats> {
    return Reflect.apply(promisify(fs.lstat), fs, [path, options]);
}

/**
 * Check if path is a directory
 * @param path
 * @returns
 */
export function statIsDirectory(
    path: NodeFs.PathLike
): Promise<{ isType: boolean; stats: NodeFs.Stats | NodeFs.BigIntStats }> {
    return new Promise((resolve, reject) => {
        fs.statIsDirectory(
            path,
            (err: NodeJS.ErrnoException | null, isType: boolean, stats: NodeFs.Stats | NodeFs.BigIntStats) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                resolve({ isType, stats });
            }
        );
    });
}

/**
 * Check if path is a file
 * @param path
 * @returns
 */
export function statIsFile(
    path: NodeFs.PathLike
): Promise<{ isType: boolean; stats: NodeFs.Stats | NodeFs.BigIntStats }> {
    return new Promise((resolve, reject) => {
        fs.statIsFile(
            path,
            (err: NodeJS.ErrnoException | null, isType: boolean, stats: NodeFs.Stats | NodeFs.BigIntStats) => {
                if (err) {
                    /* istanbul ignore next */
                    return reject(err);
                }
                resolve({ isType, stats });
            }
        );
    });
}

/**
 * Check if path is a symbolik link
 * @param path
 * @returns
 */
export function statIsSymbolicLink(
    path: NodeFs.PathLike
): Promise<{ isType: boolean; stats: NodeFs.Stats | NodeFs.BigIntStats }> {
    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
        fs.statIsSymbolicLink(
            path,
            (err: NodeJS.ErrnoException | null, isType: boolean, stats: NodeFs.Stats | NodeFs.BigIntStats) => {
                if (err) {
                    return reject(err);
                }
                resolve({ isType, stats });
            }
        );
    });
}

/**
 * Creates a symbolic link.
 *
 * The `type` argument is only used on Windows platforms and can be one of `'dir'`,`'file'`, or `'junction'`.
 * Windows junction points require the destination path
 * to be absolute. When using `'junction'`, the `target` argument will
 * automatically be normalized to absolute path.
 * @param [type='file']
 * @return Fulfills with `undefined` upon success.
 */
export function symlink(
    target: NodeFs.PathLike,
    path: NodeFs.PathLike,
    type?: "dir" | "file" | "junction" | null
): Promise<void> {
    return Reflect.apply(promisify(fs.symlink), fs, [target, path, type]);
}

/**
 * Truncates (shortens or extends the length) of the content at `path` to `len`bytes.
 * @param [len=0]
 * @return Fulfills with `undefined` upon success.
 */
export function truncate(path: NodeFs.PathLike, len?: number): Promise<void> {
    /* istanbul ignore next */
    return Reflect.apply(promisify(fs.truncate), fs, [path, len]);
}

/**
 * If `path` refers to a symbolic link, then the link is removed without affecting
 * the file or directory to which that link refers. If the `path` refers to a file
 * path that is not a symbolic link, the file is deleted.
 * See the POSIX [`unlink(2)`](http://man7.org/linux/man-pages/man2/unlink.2.html) documentation for more detail.
 * @return Fulfills with `undefined` upon success.
 */
export function unlink(path: NodeFs.PathLike): Promise<void> {
    return Reflect.apply(promisify(fs.unlink), fs, [path]);
}

/**
 * Change the file system timestamps of the object referenced by `path`.
 *
 * The `atime` and `mtime` arguments follow these rules:
 *
 * * Values can be either numbers representing Unix epoch time, `Date`s, or a
 * numeric string like `'123456789.0'`.
 * * If the value can not be converted to a number, or is `NaN`, `Infinity` or`-Infinity`, an `Error` will be thrown.
 * @return Fulfills with `undefined` upon success.
 */
export function utimes(
    path: NodeFs.PathLike,
    atime: string | number | Date,
    mtime: string | number | Date
): Promise<void> {
    return Reflect.apply(promisify(fs.utimes), fs, [path, atime, mtime]);
}

/**
 * Asynchronously writes data to a file, replacing the file if it already exists.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 * @param options Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
 * If `encoding` is not supplied, the default of `'utf8'` is used.
 * If `mode` is not supplied, the default of `0o666` is used.
 * If `mode` is a string, it is parsed as an octal integer.
 * If `flag` is not supplied, the default of `'w'` is used.
 */
export function writeFile(
    path: NodeFs.PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    options?: NodeFs.WriteFileOptions
): Promise<void> {
    return Reflect.apply(promisify(fs.writeFile), fs, [path, data, options]);
}

/**
 * Asynchronously open a directory for iterative scanning.
 * See the POSIX [`opendir(3)`](http://man7.org/linux/man-pages/man3/opendir.3.html) documentation for more detail.
 *
 * Creates an `fs.Dir`, which contains all further functions for reading from
 * and cleaning up the directory.
 *
 * The `encoding` option sets the encoding for the `path` while opening the
 * directory and subsequent read operations.
 *
 * Example using async iteration:
 *
 * ```js
 * import { opendir } from 'fs/promises';
 *
 * try {
 *   const dir = await opendir('./');
 *   for await (const dirent of dir)
 *     console.log(dirent.name);
 * } catch (err) {
 *   console.error(err);
 * }
 * ```
 *
 * When using the async iterator, the `fs.Dir` object will be automatically
 * closed after the iterator exits.
 * @return Fulfills with an {fs.Dir}.
 */
export function opendir(path: fs.PathLike, options?: fs.OpenDirOptions): Promise<fs.Dir> {
    /* istanbul ignore next */
    if ("promises" in fsAux && "opendir" in fsAux.promises) {
        return Reflect.apply(fsAux.promises.opendir, fsAux, [path, options]);
    } else {
        throw new Error("To be implemented");
    }
}
