import * as file from "./file.js";
import * as dir from "./dir.js";
import * as link from "./link.js";
import * as symlink from "./symlink.js";

export { ensureFile } from "./file.js";
export { ensureDir } from "./dir.js";
export { ensureLink } from "./link.js";
export { ensureSymlink } from "./symlink.js";

export const promises = {
    ensureFile: file.promises.ensureFile,
    ensureDir: dir.promises.ensureDir,
    ensureLink: link.promises.ensureLink,
    ensureSymlink: symlink.promises.ensureSymlink,
};
