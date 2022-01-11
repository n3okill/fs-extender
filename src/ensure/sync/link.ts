import NodePath from "path-extender";
import * as fs from "../../patch/patch.js";
import { ensureDirSync } from "./dir.js";
import * as util from "../util.js";

/**
 * ensureLink - ensures link existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureLinkSync(src, dst);
 * console.log(`Link is ensured in the file system.`);
 * ```
 *
 * @param srcPath - the source path of the link
 * @param dstPath - the destination path to the link
 * @return dstPath: fs.PathLike
 */
export function ensureLinkSync(srcPath: fs.PathLike, dstPath: fs.PathLike): fs.PathLike {
    let statDst;
    try {
        statDst = fs.lstatSync(dstPath);
    } catch (err) {}
    try {
        const statSrc = fs.lstatSync(srcPath);
        if (statDst && util.areIdentical(statSrc, statDst)) {
            return dstPath;
        }
    } catch (err) {
        (err as NodeJS.ErrnoException).message = (err as NodeJS.ErrnoException).message.replace(
            "lstat",
            "ensureLinkSync"
        );
        throw err;
    }

    ensureDirSync(NodePath.dirname(dstPath));
    fs.linkSync(srcPath, dstPath);

    return dstPath;
}
