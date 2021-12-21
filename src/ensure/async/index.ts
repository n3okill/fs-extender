import * as file from "./file";
import * as dir from "./dir";
import * as link from "./link";
import * as symlink from "./symlink";

export { ensureFile } from "./file";
export { ensureDir } from "./dir";
export { ensureLink } from "./link";
export { ensureSymlink } from "./symlink";

export const promises = {
    ensureFile: file.promises.ensureFile,
    ensureDir: dir.promises.ensureDir,
    ensureLink: link.promises.ensureLink,
    ensureSymlink: symlink.promises.ensureSymlink,
};
