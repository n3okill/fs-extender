import { filesHash, filesHashSync, filesByte, filesByteSync, promises as promisesFile } from "./file";
import { dirHash, dirHashSync, dirByte, dirByteSync, promises as promisesDir } from "./dir";
export { CompareOptionsByte, CompareOptionsHash } from "./_internal";

export { filesHash, filesByte, filesHashSync, filesByteSync };
export { dirHash, dirByte, dirHashSync, dirByteSync };

export const promises = {
    filesHash: promisesFile.filesHash,
    filesByte: promisesFile.filesByte,
    dirHash: promisesDir.dirHash,
    dirByte: promisesDir.dirByte,
};
