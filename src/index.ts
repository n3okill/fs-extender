export * from "./patch";
export { list, listSync, ListOptions, ListResultType } from "./list";
export {
    find,
    findSync,
    FindFilterType,
    FindOptions,
    FindResultType,
    FindFilterFunction,
    FindFilterFunctionAsync,
    FindOptionsAsync,
    FindFilterTypeAsync,
} from "./find";
export { mkdirp, mkdirpSync, MkdirpOptions } from "./mkdirp";
export { rm, rmSync, emptyDir, emptyDirSync, RmOptions, EmptyDirOptions, RmStreamOutType } from "./rm";
export { copy, copySync, CopyOptions, CopyOptionsErrorStream, CopyStats, CopyStreamOutType } from "./copy";
export { move, moveSync, MoveOptions, MoveStreamOutType } from "./move";
export {
    dirByte,
    dirByteSync,
    dirHash,
    dirHashSync,
    filesByte,
    filesByteSync,
    filesHash,
    filesHashSync,
    CompareOptionsByte,
    CompareOptionsHash,
} from "./compare";
export {
    ensureDir,
    ensureDirSync,
    ensureFile,
    ensureFileSync,
    ensureLink,
    ensureLinkSync,
    ensureSymlink,
    ensureSymlinkSync,
    EnsureOptionsDir,
    EnsureOptionsFile,
    EnsureOptionsSymlink,
    EnsureOptionsSymlinkType,
    EnsureSymlinkPathsType,
    EnsureOptionsFileStreamOptions,
} from "./ensure";
export {
    ensureJsonFile,
    ensureJsonFileSync,
    readJsonFile,
    readJsonFileSync,
    writeJsonFile,
    writeJsonFileSync,
    readJsonLines,
    ReadJsonOptions,
    ReplacerType,
    ReviverType,
    WriteJsonOptions,
    ReadJsonLineOptions,
    ReadJsonLinesFunction,
} from "./json";
export { size, sizeSync, SizeOptions, SizeStats } from "./size";
export { walk, walkSync, WalkAsyncFunction, WalkFunction, WalkOptions } from "./walk";

import { promises as promisesPatch } from "./patch";
import { promises as promisesList } from "./list";
import { promises as promisesFind } from "./find";
import { promises as promisesMkdirp } from "./mkdirp";
import { promises as promisesRm } from "./rm";
import { promises as promisesCopy } from "./copy";
import { promises as promisesMove } from "./move";
import { promises as promisesCompare } from "./compare";
import { promises as promisesEnsure } from "./ensure";
import { promises as promisesJson } from "./json";
import { promises as promisesSize } from "./size";
import { promises as promiseWalk } from "./walk";

export const promises = {
    ...promisesPatch,
    ...promisesList,
    ...promisesFind,
    ...promisesMkdirp,
    ...promisesRm,
    ...promisesCopy,
    ...promisesMove,
    ...promisesCompare,
    ...promisesEnsure,
    ...promisesJson,
    ...promisesSize,
    ...promiseWalk,
};
