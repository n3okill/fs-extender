// eslint-disable-next-line @typescript-eslint/no-var-requires
const fsAux = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils = require("@n3okill/utils");

const fs = {
    promises: {},
};
Object.keys(fsAux).forEach((key) => {
    if (utils.Type.isFunction(fsAux[key])) {
        fs[key] = fsAux[key].bind(fs);
    }
});
Object.keys(fsAux.promises).forEach((key) => {
    if (utils.Type.isFunctionType(fsAux.promises[key])) {
        fs.promises[key] = fsAux.promises[key].bind(fs);
    }
});

fs.stat = function (path, options, callback) {
    if (exdevRename.has(path)) {
        return fsAux.stat(path, options, callback);
    }
    fsAux.stat(path, options, (err, stats) => {
        if (!err) {
            stats.gid = -2;
            stats.uid = -2;
        }
        callback(err, stats);
    });
};

fs.promises.stat = async function (path) {
    if (exdevRename.has(path)) {
        return fsAux.promises.stat(path, options);
    }

    const stats = await fsAux.promises.stat(path);
    stats.gid = -2;
    stats.uid = -2;
    return stats;
};

fs.statSync = function (path) {
    if (exdevRename.has(path)) {
        return fsAux.statSync(path);
    }

    const stats = fsAux.statSync(path);
    stats.gid = -2;
    stats.uid = -2;
    return stats;
};

fs.readdir = function (path, options, callback) {
    if (exdevRename.has(path)) {
        return fsAux.readdir(path, options, callback);
    }

    process.nextTick(function () {
        callback(null, ["c", "x", "b"]);
    });
};

fs.promises.readdir = async function (path, options) {
    if (exdevRename.has(path)) {
        return fsAux.promises.readdir(path, options);
    }

    return ["c", "x", "b"];
};

fs.readdirSync = function (path, options) {
    if (exdevRename.has(path)) {
        return fsAux.readdirSync(path, options);
    }

    return ["c", "x", "b"];
};

const lockRmDir = new Set();
const lockUnlink = new Set();
const lockRename = new Set();
const exdevRename = new Set();

fs.addLockRmDir = function (file) {
    lockRmDir.add(file);
};
fs.removeLockRmDir = function (file) {
    lockRmDir.delete(file);
};

fs.addLockUnlink = function (file) {
    lockUnlink.add(file);
};
fs.removeLockUnlink = function (file) {
    lockUnlink.delete(file);
};
fs.addLockRename = function (file) {
    lockRename.add(file);
};
fs.removeLockRename = function (file) {
    lockRename.delete(file);
};
fs.addExdevRename = function (file) {
    exdevRename.add(file);
};
fs.removeExdevRename = function (file) {
    exdevRename.delete(file);
};

fs.rmdir = function (path, options, callback) {
    if (lockRmDir.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        if (!callback) {
            return options(err);
        }
        return callback(err);
    }
    if (!callback) {
        return fsAux.rmdir(path, options);
    } else {
        return fsAux.rmdir(path, options, callback);
    }
};

fs.promises.rmdir = async function (path, options) {
    if (lockRmDir.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        throw err;
    }
    return fsAux.promises.rmdir(path, options);
};

fs.rmdirSync = function (path, options) {
    if (lockRmDir.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        throw err;
    }
    return fsAux.rmdirSync(path, options);
};

fs.unlink = function (path, callback) {
    if (lockUnlink.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        return callback(err);
    }
    return fsAux.unlink(path, callback);
};

fs.promises.unlink = async function (path) {
    if (lockUnlink.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        throw err;
    }
    return fsAux.promises.unlink(path);
};

fs.unlinkSync = function (path) {
    if (lockUnlink.has(path)) {
        const err = new Error("File locked by system.");
        err.code = "EBUSY";
        throw err;
    }
    return fsAux.unlinkSync(path);
};

fs.rename = function (from, to, callback) {
    if (lockRename.has(from)) {
        const err = new Error("File locked by system.");
        err.code = "EPERM";
        return callback(err);
    }
    if (exdevRename.has(from)) {
        const e = new Error();
        e.code = "EXDEV";
        return callback(e);
    }

    return fsAux.rename(from, to, callback);
};

fs.promises.rename = async function (from, to) {
    if (lockRename.has(from)) {
        const err = new Error("File locked by system.");
        err.code = "EPERM";
        throw err;
    }
    if (exdevRename.has(from)) {
        const e = new Error();
        e.code = "EXDEV";
        throw e;
    }
    return fsAux.promises.rename(from, to);
};

fs.renameSync = function (from, to) {
    if (lockRename.has(from)) {
        const err = new Error("File locked by system.");
        err.code = "EPERM";
        throw err;
    }
    if (exdevRename.has(from)) {
        const e = new Error();
        e.code = "EXDEV";
        throw e;
    }
    return fsAux.renameSync(from, to);
};

module.exports = fs;
