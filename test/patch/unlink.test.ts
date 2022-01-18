process.env["FS_EXTENDER_TIMEOUT"] = "100";
process.env["FS_EXTENDER_TIMEOUT_SYNC"] = "50";

import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as fs from "../../src/patch/patch";
import * as NodeFs from "fs";
import { Common, TestDirStructure } from "../Common";
import rewiremock from "rewiremock";

const drive: TestDirStructure = {
    async: {
        file1: "content",
        file2: "content",
        file3: "content",
        folder: {},
    },
    promises: {
        file1: "content",
        file2: "content",
        file3: "content",
        folder: {},
    },
    sync: {
        file1: "content",
        file2: "content",
        file3: "content",
        folder: {},
    },
};

const common = new Common("fs-extender-patch-unlink", drive);

const lockedFiles = new Set();

const mockFs = rewiremock.proxy(
    () => require("../../src/patch/patch"),
    (r) => ({
        fs: r
            .callThrough()
            .directChildOnly()
            .toBeUsed()
            .with({
                unlink: function (path: fs.PathLike, callback: fs.NoParamCallback) {
                    if (lockedFiles.has(path)) {
                        const err = new Error("File locked by system.");
                        (err as NodeJS.ErrnoException).code = "EBUSY";
                        return callback(err);
                    }
                    NodeFs.unlink(path, callback);
                },
                unlinkSync: function (path: string): void {
                    if (lockedFiles.has(path)) {
                        const err = new Error("File locked by system");
                        (err as NodeJS.ErrnoException).code = "EBUSY";
                        throw err;
                    }
                    NodeFs.unlinkSync(path);
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
        describe("> unlink", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                test("should remove file not locked", function (done) {
                    mockFs.unlink(common.getPath("async/file1"), (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("should fail when removing file locked after unlink timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/file2");
                    lockedFiles.add(file);
                    mockFs.unlink(file, (err: NodeJS.ErrnoException | null) => {
                        expect(err).not.to.be.null;
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                        done();
                    });
                });
                test("should remove file when lock is released before unlink timeout", function (done) {
                    const file = common.getPath("async/file3");
                    lockedFiles.add(file);
                    setTimeout(() => {
                        lockedFiles.delete(file);
                    }, 20);
                    mockFs.unlink(file, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("should fail removing directory", function (done) {
                    const path = common.getPath("async/folder");
                    mockFs.unlink(path, (err: NodeJS.ErrnoException | null) => {
                        expect(err).not.to.be.null;
                        expect(err)
                            .to.have.property("code")
                            .to.match(/EISDIR|EPERM/);
                        done();
                    });
                });
            });
            describe("> promise", function () {
                test("should remove file not locked", async function () {
                    await expect(mockFsPromises.unlink(common.getPath("promises/file1"))).not.to.eventually.rejected;
                });
                test("should fail when removing file locked after unlink timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/file2");
                    lockedFiles.add(file);
                    const err = await expect(mockFsPromises.unlink(file)).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                });
                test("should remove file when lock is released before unlink timeout", async function () {
                    const file = common.getPath("promises/file3");
                    lockedFiles.add(file);
                    setTimeout(() => {
                        lockedFiles.delete(file);
                    }, 20);
                    await expect(mockFsPromises.unlink(file)).to.not.eventually.rejected;
                });
                test("should fail removing directory", async function () {
                    const path = common.getPath("promises/folder");
                    const err = await expect(mockFsPromises.unlink(path)).to.eventually.rejected;
                    expect(err)
                        .to.have.property("code")
                        .to.match(/EISDIR|EPERM/);
                });
            });
            describe("> sync", function () {
                test("should remove file not locked", function () {
                    expect(() => mockFs.unlinkSync(common.getPath("sync/file1"))).not.to.throw();
                });
                test("should fail when removing file locked after unlink timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/file2");
                    lockedFiles.add(file);
                    expect(() => mockFs.unlinkSync(file))
                        .to.throw()
                        .to.have.property("code", "EBUSY");
                });
                test("should remove file when lock is released before unlink timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/file3");
                    lockedFiles.add(file);
                    expect(() => mockFs.unlinkSync(file)).to.throw(/File locked by system/);
                    lockedFiles.delete(file);
                    expect(() => mockFs.unlinkSync(file)).not.to.throw();
                });
                test("should fail removing directory", function () {
                    const path = common.getPath("sync/folder");
                    expect(() => mockFs.unlinkSync(path))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/EISDIR|EPERM/);
                });
            });
        });
    });
});
