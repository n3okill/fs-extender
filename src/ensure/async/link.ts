import NodePath from "path-extender";
import * as fs from "../../patch/patch.js";
import * as util from "../util.js";
import * as dir from "./dir.js";

/** @internal */
async function _ensureLink(srcPath: fs.PathLike, dstPath: fs.PathLike): Promise<fs.PathLike> {
    let statDst;
    try {
        statDst = await fs.promises.lstat(dstPath);
    } catch (err) {}
    try {
        const statSrc = await fs.promises.lstat(srcPath);
        if (statDst && util.areIdentical(statSrc, statDst)) {
            return dstPath;
        }
    } catch (err) {
        (err as NodeJS.ErrnoException).message.replace("lstat", "ensureLink");
        throw err;
    }
    await dir.promises.ensureDir(NodePath.dirname(dstPath));
    await fs.promises.link(srcPath, dstPath);
    return dstPath;
}

/**
 * ensureLink - ensures link existence on file system
 *
 * ```js
 * import * as fs from "fs-extender"
 * fs.ensureLink(src, dst,(err)=>{
 *  if(!err) {
 *      console.log(`Link is ensured in the file system.`);
 *  }
 * });
 * ```
 *
 * @param srcPath - the source path of the link
 * @param dstPath - the destination path to the link
 * @param callback - (err: Error | null, dstPath: fs.PathLike)
 */
export function ensureLink(
    srcPath: fs.PathLike,
    dstPath: fs.PathLike,
    callback: (err: NodeJS.ErrnoException | null, dstPath?: fs.PathLike) => void
): void {
    _ensureLink(srcPath, dstPath)
        .then((res) => callback(null, res))
        .catch((err) => callback(err));
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace promises {
    /**
     * ensureLink - ensures link existence on file system
     *
     * ```js
     * import * as fs from "fs-extender"
     * await fs.promises.ensureLink(src, dst);
     * console.log(`Link is ensured in the file system.`);
     * ```
     *
     * @param srcPath - the source path of the link
     * @param dstPath - the destination path to the link
     * @return dstPath: fs.PathLike
     */
    export async function ensureLink(srcPath: fs.PathLike, dstPath: fs.PathLike): Promise<fs.PathLike> {
        return _ensureLink(srcPath, dstPath);
    }
}
