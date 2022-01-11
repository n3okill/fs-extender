import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import { Type } from "@n3okill/utils";

import * as fs from "../../src/patch/patch.js";
import * as rm from "../../src/rm/index.js";
import { Common, TestDirStructure } from "../Common.js";
import { Readable } from "stream";
import NodePath from "path-extender";

const drive: TestDirStructure = {
    async: {
        d2: {
            emptyFolder: {},
            file: "",
            "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            folder1: {
                "file.txt": "",
                "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            },
            folder2: {
                subFolder1: {
                    "file.txt": "",
                    subsubFolder1: {
                        "subfile1.txt": "content",
                        subsubFolder1: {
                            "subfile1.txt": "content",
                        },
                    },
                    subsubFolder2: {
                        "subfile1.txt": "content",
                    },
                    subsubFolder3: {
                        "subfile1.txt": "content",
                    },
                },
                "file2.txt": "",
            },
            folder3: {
                subfolder1: {
                    filterFolder: {
                        file: "",
                    },
                    file2: "",
                },
                file3: "",
            },
            fileChmod: "",
            folderChmod: {
                file: "",
            },
            folder4: {
                subFolderChmod: {
                    file: "",
                },
            },
            folder5: {
                subFolder1: {
                    "file.txt": "",
                },
                "file2.txt": "",
            },
            "file.txt": "content",
        },
        emptyDir: {
            d2: {
                file: "",
                emptyFolder: {},
                folder1: {
                    file: "",
                },
                folder2: {
                    subfolder1: {
                        file: "",
                    },
                    file2: "",
                },
                folder3: {
                    subfolder1: {
                        file: "",
                    },
                    file2: "",
                },
            },
        },
    },
    promises: {
        d2: {
            emptyFolder: {},
            file: "",
            "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            folder1: {
                "file.txt": "",
                "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            },
            folder2: {
                subFolder1: {
                    "file.txt": "",
                    subsubFolder1: {
                        "subfile1.txt": "content",
                        subsubFolder1: {
                            "subfile1.txt": "content",
                        },
                    },
                    subsubFolder2: {
                        "subfile1.txt": "content",
                    },
                    subsubFolder3: {
                        "subfile1.txt": "content",
                    },
                },
                "file2.txt": "",
            },
            folder3: {
                subfolder1: {
                    filterFolder: {
                        file: "",
                    },
                    file2: "",
                },
                file3: "",
            },
            fileChmod: "",
            folderChmod: {
                file: "",
            },
            folder4: {
                subFolderChmod: {
                    file: "",
                },
            },
            folder5: {
                subFolder1: {
                    "file.txt": "",
                },
                "file2.txt": "",
            },
            "file.txt": "content",
        },
        emptyDir: {
            d2: {
                file: "",
                emptyFolder: {},
                folder1: {
                    file: "",
                },
                folder2: {
                    subfolder1: {
                        file: "",
                    },
                    file2: "",
                },
                folder3: {
                    subfolder1: {
                        file: "",
                    },
                    file2: "",
                },
            },
        },
    },
    sync: {
        d2: {
            emptyFolder: {},
            file: "",
            "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            folder1: {
                "file.txt": "",
                "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
            },
            folder2: {
                subFolder1: {
                    "file.txt": "",
                    subsubFolder1: {
                        "subfile1.txt": "content",
                        subsubFolder1: {
                            "subfile1.txt": "content",
                        },
                    },
                    subsubFolder2: {
                        "subfile1.txt": "content",
                    },
                    subsubFolder3: {
                        "subfile1.txt": "content",
                    },
                },
                "file2.txt": "",
            },
            folder3: {
                subfolder1: {
                    filterFolder: {
                        file: "",
                    },
                    file2: "",
                },
                file3: "",
            },
            fileChmod: "",
            folderChmod: {
                file: "",
            },
            folder4: {
                subFolderChmod: {
                    file: "",
                },
            },
            "file.txt": "content",
        },
        emptyDir: {
            d2: {
                file: "",
                emptyFolder: {},
                folder1: {
                    file: "",
                },
                folder2: {
                    subfolder1: {
                        file: "",
                    },
                    file2: "",
                },
            },
        },
    },
};

const common = new Common("fs-extender-rm", drive);

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path) || Buffer.isBuffer(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

describe("fs-extender", function () {
    describe("> rm", function () {
        let cwd: string;
        before(async function () {
            await common.beforeAll();
            cwd = process.cwd();
            process.chdir(common.getPath(""));
            await fs.promises.chmod(getPath("async", "d2/fileChmod"), 0o444);
            await fs.promises.chmod(getPath("promises", "d2/fileChmod"), 0o444);
            await fs.promises.chmod(getPath("sync", "d2/fileChmod"), 0o444);
            await fs.promises.writeFile(Buffer.from(getPath("async", "d2/bufferFile.txt")), "buffer file");
            await fs.promises.writeFile(Buffer.from(getPath("promises", "d2/bufferFile.txt")), "buffer file");
            await fs.promises.writeFile(Buffer.from(getPath("sync", "d2/bufferFile.txt")), "buffer file");
        });
        after(async function () {
            process.chdir(cwd);
            return common.afterAll();
        });
        describe("> async", function () {
            describe("> rm", function () {
                test("remove non-existent", function (done) {
                    const path = getPath("async", ["d2", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.not.be.null;
                        done();
                    });
                });
                test("remove non-existent force = true", function (done) {
                    const path = getPath("async", ["d2", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    rm.rm(path, { force: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("remove file", function (done) {
                    const path = getPath("async", ["d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("test on buffer created path", function (done) {
                    const path = getPath("async", "d2/bufferFile.txt");
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("test with buffer path", function (done) {
                    const path = Buffer.from(getPath("async", "d2/file.txt"));
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove file with special characters", function (done) {
                    const path = getPath("async", ["d2", "special_‰øᵹ_chars.src"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove empty folder", function (done) {
                    const path = getPath("async", ["d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove non-empty folder", function (done) {
                    const path = getPath("async", ["d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove non-empty complex folder", function (done) {
                    const path = getPath("async", ["d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove chmod file", function (done) {
                    const path = getPath("async", ["d2", "fileChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove chmod folder", function (done) {
                    const path = getPath("async", ["d2", "folderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("remove chmod subFolder", function (done) {
                    const path = getPath("async", ["d2", "folder4", "subFolderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
                test("test noPreserveRoot option", function (done) {
                    rm.rm(NodePath.parse(NodePath.sep).root, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.have.property("code", "EPERM");
                        done();
                    });
                });
                test("remove non-empty complex folder using stream", function (done) {
                    const path = getPath("async", ["d2", "folder5"]);

                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: rm.RmStreamOutType = JSON.parse(chunk);
                        if (obj.error) {
                            dirs--;
                        } else {
                            if (obj.type.toLowerCase() === "file") {
                                files++;
                            } else {
                                dirs++;
                            }
                        }
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rm(path, { recursive: true, stream: stream }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        expect(files).to.be.equal(2);
                        expect(dirs).to.be.equal(2);
                        done();
                    });
                });
            });
            describe("> emptyDir", function () {
                test("should not remove file", function (done) {
                    const path = getPath("async", ["emptyDir", "d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDir(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.not.be.null;
                        expect(err).to.have.property("code", "EEXIST");
                        expect(fs.existsSync(path)).to.be.true;
                        done();
                    });
                });
                test("should not remove empty folder", function (done) {
                    const path = getPath("async", ["emptyDir", "d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDir(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.true;
                        done();
                    });
                });
                test("should clean non-empty folder", function (done) {
                    const path = getPath("async", ["emptyDir", "d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDir(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(path) as string[]).to.have.length(0);
                        expect(fs.existsSync(path)).to.be.true;
                        done();
                    });
                });
                test("should clean non-empty folder with sub-folders", function (done) {
                    const path = getPath("async", ["emptyDir", "d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDir(path, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(path) as string[]).to.have.length(0);
                        expect(fs.existsSync(path)).to.be.true;
                        done();
                    });
                });
                test("should clean non-empty folder with sub-folders with stream", function (done) {
                    const path = getPath("async", ["emptyDir", "d2", "folder3"]);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: rm.RmStreamOutType = JSON.parse(chunk);
                        if (obj.error) {
                            dirs--;
                        } else {
                            if (obj.type.toLowerCase() === "file") {
                                files++;
                            } else {
                                dirs++;
                            }
                        }
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDir(path, { stream: stream }, (err: NodeJS.ErrnoException): void => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(path) as string[]).to.have.length(0);
                        expect(fs.existsSync(path)).to.be.true;
                        expect(files).to.be.equal(2);
                        expect(dirs).to.be.equal(1);
                        done();
                    });
                });
            });
        });
        describe("> promise", function () {
            describe("> rm", function () {
                test("remove non-existent", async function () {
                    const path = getPath("promises", ["d2", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    expect(rm.promises.rm(path)).to.eventually.rejected;
                });
                test("remove non-existent force = true", async function () {
                    const path = getPath("promises", ["d2", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    expect(rm.promises.rm(path, { force: true })).to.not.eventually.rejected;
                });
                test("remove file", async function () {
                    const path = getPath("promises", ["d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test on buffer path", async function () {
                    const path = getPath("promises", "d2/bufferFile.txt");
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test with buffer path", async function () {
                    const path = Buffer.from(getPath("promises", "d2/file.txt"));
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove file with special characters", async function () {
                    const path = getPath("promises", ["d2", "special_‰øᵹ_chars.src"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove empty folder", async function () {
                    const path = getPath("promises", ["d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove non-empty folder", async function () {
                    const path = getPath("promises", ["d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove non-empty complex folder", async function () {
                    const path = getPath("promises", ["d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove chmod file", async function () {
                    const path = getPath("promises", ["d2", "fileChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove chmod folder", async function () {
                    const path = getPath("promises", ["d2", "folderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove chmod subFolder", async function () {
                    const path = getPath("promises", ["d2", "folder4", "subFolderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test noPreserveRoot option", async function () {
                    await expect(
                        rm.promises.rm(NodePath.parse(NodePath.sep).root)
                    ).to.eventually.rejected.to.have.property("code", "EPERM");
                });
                test("remove non-empty complex folder using stream", async function () {
                    const path = getPath("promises", ["d2", "folder5"]);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: rm.RmStreamOutType = JSON.parse(chunk);
                        if (obj.error) {
                            dirs--;
                        } else {
                            if (obj.type.toLowerCase() === "file") {
                                files++;
                            } else {
                                dirs++;
                            }
                        }
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.rm(path, {
                        recursive: true,
                        stream: stream,
                    });
                    expect(fs.existsSync(path)).to.be.false;
                    expect(files).to.be.equal(2);
                    expect(dirs).to.be.equal(2);
                });
            });
            describe("> emptyDir", function () {
                test("should not remove file", async function () {
                    const path = getPath("promises", ["emptyDir", "d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    const err = await expect(rm.promises.emptyDir(path)).to.eventually.rejected;
                    expect(err).to.have.property("code", "EEXIST");
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should not remove empty folder", async function () {
                    const path = getPath("promises", ["emptyDir", "d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.emptyDir(path);
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should clean non-empty folder", async function () {
                    const path = getPath("promises", ["emptyDir", "d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.emptyDir(path);
                    expect(fs.readdirSync(path) as string[]).to.have.length(0);
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should clean non-empty folder with sub-folders", async function () {
                    const path = getPath("promises", ["emptyDir", "d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.emptyDir(path);
                    expect(fs.readdirSync(path) as string[]).to.have.length(0);
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should clean non-empty folder with sub-folders with stream", async function () {
                    const path = getPath("promises", ["emptyDir", "d2", "folder3"]);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: rm.RmStreamOutType = JSON.parse(chunk);
                        if (obj.error) {
                            throw obj.error;
                        } else {
                            if (obj.type.toLowerCase() === "file") {
                                files++;
                            } else {
                                dirs++;
                            }
                        }
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    await rm.promises.emptyDir(path, { stream: stream });
                    expect(fs.readdirSync(path) as string[]).to.have.length(0);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(files).to.be.equal(2);
                    expect(dirs).to.be.equal(1);
                });
            });
        });
        describe("> sync", function () {
            describe("> rm", function () {
                test("remove non-existent", function () {
                    const path = getPath("sync", ["d2", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    expect(() => rm.rmSync(path)).to.throw();
                });
                test("remove non-existent force = true", function () {
                    const path = getPath("sync", ["d1", "non-existent"]);
                    expect(fs.existsSync(path)).to.be.false;
                    expect(() => rm.rmSync(path, { force: true })).to.not.throw();
                });
                test("remove file", function () {
                    const path = getPath("sync", ["d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test on buffer path", function () {
                    const path = getPath("sync", "d2/bufferFile.txt");
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test with buffer path", function () {
                    const path = Buffer.from(getPath("sync", "d2/file.txt"));
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove file with special characters", function () {
                    const path = getPath("sync", ["d2", "special_‰øᵹ_chars.src"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove empty folder", function () {
                    const path = getPath("sync", ["d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove non-empty folder", function () {
                    const path = getPath("sync", ["d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove non-empty complex folder", function () {
                    const path = getPath("sync", ["d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove chmod file", function () {
                    const path = getPath("sync", ["d2", "fileChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path);
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("remove chmod folder", function () {
                    const path = getPath("sync", ["d2", "folderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
                test("test noPreserveRoot option", function () {
                    expect(() => rm.rmSync(NodePath.parse(NodePath.sep).root))
                        .to.throw()
                        .to.have.property("code", "EPERM");
                });
                test("remove chmod subFolder", function () {
                    const path = getPath("sync", ["d2", "folder4", "subFolderChmod"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.rmSync(path, { recursive: true });
                    expect(fs.existsSync(path)).to.be.false;
                });
            });
            describe("> emptyDir", function () {
                test("should not remove file", function () {
                    const path = getPath("sync", ["emptyDir", "d2", "file"]);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(() => rm.emptyDirSync(path))
                        .to.throw()
                        .to.have.property("code", "EEXIST");
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should not remove empty folder", function () {
                    const path = getPath("sync", ["emptyDir", "d2", "emptyFolder"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDirSync(path);
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should clean non-empty folder", function () {
                    const path = getPath("sync", ["emptyDir", "d2", "folder1"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDirSync(path);
                    expect(fs.readdirSync(path) as string[]).to.have.length(0);
                    expect(fs.existsSync(path)).to.be.true;
                });
                test("should clean non-empty folder with sub-folders", function () {
                    const path = getPath("sync", ["emptyDir", "d2", "folder2"]);
                    expect(fs.existsSync(path)).to.be.true;
                    rm.emptyDirSync(path);
                    expect(fs.readdirSync(path) as string[]).to.have.length(0);
                    expect(fs.existsSync(path)).to.be.true;
                });
            });
        });
    });
});
