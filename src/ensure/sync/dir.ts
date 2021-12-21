import * as fs from "../../patch";
import { mkdirpSync } from "../../mkdirp";
import * as util from "../util";
import { Type } from "@n3okill/utils";

/**
 * EnsureDir - ensures directory existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureDirSync(path);
 * console.log(`${path} is ensured in the file system.`);
 * ```
 *
 * @param path - the path to the directory
 * @param options - used to create the directory or modify it, options can be
 * - `mode` - to set the directory mode, default: 0o777
 * @return fs.PathLike - path to the directory
 */
export function ensureDirSync(path: fs.PathLike, options?: util.EnsureOptionsDir): fs.PathLike {
    const opt = util.getOptionsDir(options);
    mkdirpSync(path, opt);
    const stat = fs.statSync(path);
    if (!Type.isUndefined(opt.mode) && (stat.mode & parseInt("0777", 8)) !== opt.mode) {
        fs.chmodSync(path, opt.mode as fs.Mode);
    }
    return path;
}
