import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as fs from "../../src/patch";
import * as NodeFs from "fs";
import { Common, TestDirStructure } from "../Common";
import rewiremock from "rewiremock";

const drive: TestDirStructure = {
    async: {
        folder: {
            "file1.txt": "content",
            "file2.txt": "content",
            "file3.txt": "content",
        },
        folder1: {},
        folder2: {},
        folder3: {},
    },
    promises: {
        folder: {
            "file1.txt": "content",
            "file2.txt": "content",
            "file3.txt": "content",
        },
        folder1: {},
        folder2: {},
        folder3: {},
    },
    sync: {
        folder: {
            "file1.txt": "content",
            "file2.txt": "content",
            "file3.txt": "content",
        },
        folder1: {},
        folder2: {},
        folder3: {},
    },
};

const common = new Common("fs-extender-patch-rmdir", drive);

const lockedFiles = new Set();

const mockFs = rewiremock.proxy(
    () => require("../../src/patch/patch"),
    (r) => ({
        fs: r
            .callThrough()
            .directChildOnly()
            .toBeUsed()
            .with({
                rmdir: function (path: fs.PathLike, options: fs.RmDirOptions, callback: fs.NoParamCallback) {
                    if (lockedFiles.has(path)) {
                        const err = new Error("File locked by system.");
                        (err as NodeJS.ErrnoException).code = "EBUSY";
                        if (!callback) {
                            return (options as fs.NoParamCallback)(err);
                        }
                        return callback(err);
                    }
                    if (!callback) {
                        return NodeFs.rmdir(path, options as fs.NoParamCallback);
                    } else {
                        NodeFs.rmdir(path, options, callback);
                    }
                },
                rmdirSync: function (path: string, options: fs.RmDirOptions): void {
                    if (lockedFiles.has(path)) {
                        const err = new Error("File locked by system");
                        (err as NodeJS.ErrnoException).code = "EBUSY";
                        throw err;
                    }
                    NodeFs.rmdirSync(path, options);
                },
            }),
    })
);
const mockFsPromises = rewiremock.proxy(
    () => require("../../src/patch/promises"),
    (r) => ({
        "./patch": r.callThrough().directChildOnly().toBeUsed().with(mockFs),
    })
);
describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> rmdir", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                test("should remove directory not locked", function (done) {
                    mockFs.rmdir(common.getPath("async/folder1"), {}, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("should fail when removing directory locked after rmdir timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/folder2");
                    lockedFiles.add(file);
                    mockFs.rmdir(file, {}, (err: NodeJS.ErrnoException | null) => {
                        expect(err).not.to.be.null;
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                        done();
                    });
                });
                test("should remove directory when lock is released before rmdir timeout with maxRetries = 1", function (done) {
                    const file = common.getPath("async/folder3");
                    lockedFiles.add(file);
                    setTimeout(() => {
                        lockedFiles.delete(file);
                    }, 20);
                    mockFs.rmdir(file, { maxRetries: 1 }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("should remove directory not empty with recursive = true", function (done) {
                    const path = common.getPath("async/folder");
                    mockFs.rmdir(path, { recursive: true }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.false;
                        done();
                    });
                });
            });
            describe("> promise", function () {
                test("should remove directory file not locked", async function () {
                    await expect(mockFsPromises.rmdir(common.getPath("promises/folder1"))).not.to.eventually.rejected;
                });
                test("should fail when removing directory locked file after rmdir timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/folder2");
                    lockedFiles.add(file);
                    const err = await expect(mockFsPromises.rmdir(file)).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                });
                test("should remove directory when lock is released before rmdir timeout with maxRetries = 1", async function () {
                    const file = common.getPath("promises/folder3");
                    lockedFiles.add(file);
                    setTimeout(() => {
                        lockedFiles.delete(file);
                    }, 20);
                    await expect(mockFsPromises.rmdir(file, { maxRetries: 1 })).not.to.eventually.rejected;
                });
                test("should remove directory not empty with recursive = true", async function () {
                    const path = common.getPath("promises/folder");
                    await expect(mockFsPromises.rmdir(path, { recursive: true })).not.to.eventually.rejected;
                    expect(fs.existsSync(path)).to.be.false;
                });
            });
            describe("> sync", function () {
                test("should remove directory file not locked", function () {
                    expect(() => mockFs.rmdirSync(common.getPath("sync/folder1"))).not.to.throw();
                });
                test("should fail when removing directory locked file after rmdir timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/folder2");
                    lockedFiles.add(file);
                    expect(() => mockFs.rmdirSync(file))
                        .to.throw()
                        .to.have.property("code", "EBUSY");
                });
                test("should remove directory when lock is released before rmdir timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/folder3");
                    lockedFiles.add(file);
                    expect(() => mockFs.rmdirSync(file)).to.throw(/File locked by system/);
                    lockedFiles.delete(file);
                    expect(() => mockFs.rmdirSync(file)).not.to.throw();
                });
                test("should remove directory not empty with recursive = true", function () {
                    const path = common.getPath("sync/folder");
                    expect(() => mockFs.rmdirSync(path, { recursive: true })).not.to.throw();
                    expect(fs.existsSync(path)).to.be.false;
                });
            });
        });
    });
});
