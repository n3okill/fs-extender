process.env["FS_EXTENDER_TEST_PLATFORM"] = "win32";
process.env["FS_EXTENDER_WIN32_TIMEOUT"] = "50";
process.env["FS_EXTENDER_WIN32_TIMEOUT_SYNC"] = "50";

import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as fs from "../../src/patch";
import { Common, TestDirStructure } from "../Common";
import rewiremock from "rewiremock";

const drive: TestDirStructure = {
    async: {
        "file1.txt": "content",
        "file2.txt": "content",
        "file3.txt": "content",
    },
    promises: {
        "file1.txt": "content",
        "file2.txt": "content",
        "file3.txt": "content",
    },
    sync: {
        "file1.txt": "content",
        "file2.txt": "content",
        "file3.txt": "content",
    },
};

const common = new Common("fs-extender-patch-rename", drive);

const lockedFiles = new Set();
const mockFs = rewiremock.proxy(
    () => require("../../src/patch/patch"),
    (r) => ({
        fs: r
            .callThrough()
            .directChildOnly()
            .toBeUsed()
            .with({
                rename: function (from: string, to: string, callback: (err: NodeJS.ErrnoException | null) => void) {
                    if (lockedFiles.has(from)) {
                        const err = new Error("File locked by system.");
                        (err as NodeJS.ErrnoException).code = "EPERM";
                        return callback(err);
                    }
                    fs.rename(from, to, callback);
                },
                renameSync: function (from: string, to: string): void {
                    if (lockedFiles.has(from)) {
                        const err = new Error("File locked by system");
                        (err as NodeJS.ErrnoException).code = "EPERM";
                        throw err;
                    }
                    fs.renameSync(from, to);
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
        describe("> rename", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                test("should rename file not locked", function (done) {
                    mockFs.rename(
                        common.getPath("async/file1.txt"),
                        common.getPath("async/file1Renamed.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
                test("should fail when renaming locked file after rename timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/file2.txt");
                    lockedFiles.add(file);
                    mockFs.rename(
                        file,
                        common.getPath("async/file2Renamed.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).not.to.be.null;
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EPERM");
                            done();
                        }
                    );
                });
                test("should rename file when lock is released before rename timeout", function (done) {
                    const file = common.getPath("async/file3.txt");
                    lockedFiles.add(file);
                    setTimeout(() => {
                        lockedFiles.delete(file);
                    }, 20);
                    mockFs.rename(
                        file,
                        common.getPath("async/file3Renamed.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
            });
            describe("> promise", function () {
                test("should rename file not locked", async function () {
                    await expect(
                        mockFsPromises.rename(
                            common.getPath("promises/file1.txt"),
                            common.getPath("promises/file1Renamed.txt")
                        )
                    ).not.to.eventually.rejected;
                });
                test("should fail when renaming locked file after rename timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/file2.txt");
                    lockedFiles.add(file);
                    await expect(
                        mockFsPromises.rename(file, common.getPath("promises/file2Renamed.txt"))
                    ).to.eventually.rejectedWith(/File locked/);
                });
                test("should rename file when lock is released before rename timeout", async function () {
                    const file = common.getPath("promises/file3.txt");
                    lockedFiles.add(file);
                    setTimeout((): void => {
                        lockedFiles.delete(file);
                    }, 20);
                    await expect(mockFsPromises.rename(file, common.getPath("promises/file3Renamed.txt"))).not.to
                        .eventually.rejected;
                });
            });
            describe("> sync", function () {
                test("should rename file not locked", function () {
                    expect(() =>
                        mockFs.renameSync(common.getPath("sync/file1.txt"), common.getPath("sync/file1Renamed.txt"))
                    ).not.to.throw();
                });
                test("should fail when renaming locked file after rename timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/file2.txt");
                    lockedFiles.add(file);
                    expect(() => mockFs.renameSync(file, common.getPath("sync/file2Renamed.txt"))).to.throw(
                        /File locked by system/
                    );
                });
                test("should rename file when lock is released before rename timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/file3.txt");
                    lockedFiles.add(file);
                    expect((): void => mockFs.renameSync(file, common.getPath("sync/file3Renamed.txt"))).to.throw(
                        /File locked by system/
                    );
                    lockedFiles.delete(file);
                    expect(() => mockFs.renameSync(file, common.getPath("sync/file3Renamed.txt"))).not.to.throw();
                });
            });
        });
    });
});
