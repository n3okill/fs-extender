import * as util from "../util";
import * as fs from "../../patch";
import * as mkdirp from "../../mkdirp";

/** @internal */
async function _ensureDir(path: fs.PathLike, options: util._EnsureOptionsDirInternal): Promise<fs.PathLike> {
    await mkdirp.promises.mkdirp(path, options);
    const stat = await fs.promises.stat(path);
    if (options.mode && (stat.mode & 0o777) !== options.mode) {
        await fs.promises.chmod(path, options.mode as fs.Mode);
    }
    return path;
}

/**
 * EnsureDir - ensures directory existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureDir(path,(err)=>{
 *  if(!err) {
 *      console.log(`${path} is ensured in the file system.`);
 *  }
 * });
 * ```
 *
 * @param path - the path to the directory
 * @param options - used to create the directory or modify it, options can be
 * - `mode` - to set the directory mode, default: 0o777
 * @param callback - `(err: Error | null, path: fs.PathLike)
 */
export function ensureDir(
    path: fs.PathLike,
    options: util.EnsureOptionsDir,
    callback: (err: NodeJS.ErrnoException, path: fs.PathLike) => void
): void;
export function ensureDir(path: fs.PathLike, callback: (err: NodeJS.ErrnoException, path: fs.PathLike) => void): void;
export function ensureDir(path: fs.PathLike, options?: unknown, callback?: unknown): void {
    const opt = util.getOptionsDir(options);
    const cb = util.getCallback(options, callback);
    _ensureDir(path, opt)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * EnsureDir - ensures directory existence on file system
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.ensureDir(path);
     * console.log(`${path} is ensured in the file system.`);
     * ```
     *
     * @param path - the path to the directory
     * @param options - used to create the directory or modify it, options can be
     * - `mode` - to set the directory mode, default: 0o777
     * @return Promise<string> path to the directory
     */
    export async function ensureDir(path: fs.PathLike, options?: util.EnsureOptionsDir): Promise<fs.PathLike> {
        const opt = util.getOptionsDir(options);
        return _ensureDir(path, opt);
    }
}
