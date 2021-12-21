/* eslint-disable @typescript-eslint/no-explicit-any */
import NodePath from "path-extender";
process.env["FS_EXTENDER_FS_OVERRIDE"] = NodePath.join(__dirname, "mocked.js");
process.env["FS_EXTENDER_TIMEOUT"] = "50";
process.env["FS_EXTENDER_TIMEOUT_SYNC"] = "50";
process.env["FS_EXTENDER_TEST_PLATFORM"] = "win32";
process.env["FS_EXTENDER_WIN32_TIMEOUT"] = "50";
process.env["FS_EXTENDER_WIN32_TIMEOUT_SYNC"] = "50";

import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);
import * as fs from "../../src";
import { Common, TestDirStructure } from "../Common";
import { Readable } from "stream";

/**
 * This tests are the same tests that are using rewiremock, but here will use a mocked fs module passed into the fs-extender module
 */

const drive: TestDirStructure = {
    async: {
        rmdir: {
            folder2: {},
            folder3: {},
        },
        unlink: {
            file2: "content",
            file3: "content",
        },
        rename: {
            "file2.txt": "content",
            "file3.txt": "content",
        },
        move: {
            d1: {
                t3: {
                    f1: "f1",
                },
                t3dst: {
                    f2: "f2",
                },
            },
            d2: {
                t7: {
                    f1: "f1",
                },
                t9: {
                    f1: "f1",
                },
                t11: {
                    f1: "f1",
                },
            },
        },
    },
    promises: {
        rmdir: {
            folder2: {},
            folder3: {},
        },
        unlink: {
            file2: "content",
            file3: "content",
        },
        rename: {
            "file2.txt": "content",
            "file3.txt": "content",
        },
        move: {
            d1: {
                t3: {
                    f1: "f1",
                },
                t3dst: {
                    f2: "f2",
                },
            },
            d2: {
                t7: {
                    f1: "f1",
                },
                t9: {
                    f1: "f1",
                },
                t11: {
                    f1: "f1",
                },
            },
        },
    },
    sync: {
        rmdir: {
            folder2: {},
            folder3: {},
        },
        unlink: {
            file2: "content",
            file3: "content",
        },
        rename: {
            "file2.txt": "content",
            "file3.txt": "content",
        },
        move: {
            d1: {
                t3: {
                    f1: "f1",
                },
                t3dst: {
                    f2: "f2",
                },
            },
            d2: {
                t7: {
                    f1: "f1",
                },
                t9: {
                    f1: "f1",
                },
                t11: {
                    f1: "f1",
                },
            },
        },
    },
};

const common = new Common("fs-extender-externalfs-mocked", drive);

describe("fs-extender", function () {
    before(async () => common.beforeAll());
    after(async () => common.afterAll());
    describe("> external fs", function () {
        describe("> async", function () {
            describe("> Stats", function () {
                test("stat uid and gid", function (done) {
                    fs.stat(__filename, (enfsErr: NodeJS.ErrnoException | null, enfsStats: fs.Stats): void => {
                        expect(enfsErr).to.be.null;
                        expect(enfsStats.uid).to.be.equal(0xfffffffe);
                        expect(enfsStats.gid).to.be.equal(0xfffffffe);
                        done();
                    });
                });
            });
            describe("> readdir", function () {
                test("should test readdir reorder", function (done) {
                    fs.readdir(__dirname, (err: NodeJS.ErrnoException | null, files: string[]) => {
                        expect(err).to.be.null;
                        expect(files).to.eql(["b", "c", "x"]);
                        done();
                    });
                });
            });
            describe("> rmdir", function () {
                test("should fail when removing directory locked after rmdir timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/rmdir/folder2");
                    (fs as any).addLockRmDir(file);
                    fs.rmdir(file, {}, (err: NodeJS.ErrnoException | null) => {
                        expect(err).not.to.be.null;
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                        done();
                    });
                });
                test("should remove directory when lock is released before rmdir timeout with maxRetries = 1", function (done) {
                    const file = common.getPath("async/rmdir/folder3");
                    (fs as any).addLockRmDir(file);
                    setTimeout(() => {
                        (fs as any).removeLockRmDir(file);
                    }, 20);
                    fs.rmdir(
                        common.getPath("async/rmdir/folder3"),
                        { maxRetries: 1 },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
            });
            describe("> unlink", function () {
                test("should fail when removing file locked after unlink timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/unlink/file2");
                    (fs as any).addLockUnlink(file);
                    fs.unlink(file, (err: NodeJS.ErrnoException | null) => {
                        expect(err).not.to.be.null;
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("EBUSY");
                        done();
                    });
                });
                test("should remove file when lock is released before unlink timeout", function (done) {
                    const file = common.getPath("async/unlink/file3");
                    (fs as any).addLockUnlink(file);
                    setTimeout(() => {
                        (fs as any).removeLockUnlink(file);
                    }, 20);
                    fs.unlink(common.getPath("async/unlink/file3"), (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
            });
            describe("> rename", function () {
                test("should fail when renaming locked file after rename timeout", function (done) {
                    this.slow(200);
                    const file = common.getPath("async/rename/file2.txt");
                    (fs as any).addLockRename(file);
                    fs.rename(
                        file,
                        common.getPath("async/rename/file2Renamed.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).not.to.be.null;
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EPERM");
                            done();
                        }
                    );
                });
                test("should rename file when lock is released before rename timeout", function (done) {
                    const file = common.getPath("async/rename/file3.txt");
                    (fs as any).addLockRename(file);
                    setTimeout(() => {
                        (fs as any).removeLockRename(file);
                    }, 20);
                    fs.rename(
                        common.getPath("async/rename/file3.txt"),
                        common.getPath("async/rename/file3Renamed.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
            });
            describe("> move", function () {
                test("should overwrite folders across devices", function (done) {
                    const src = common.getPath("async/move/d1/t3");
                    const dst = common.getPath("async/move/d1/t3dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    fs.move(src, dst, { overwrite: true }, function (err: NodeJS.ErrnoException | null) {
                        expect(err).to.be.null;
                        expect(fs.existsSync(src)).to.be.false;
                        expect(fs.existsSync(dst + "/f1")).to.be.true;
                        done();
                    });
                });
                test("should work across devices", function (done) {
                    const src = common.getPath("async/move/d2/t7/f1");
                    const dst = common.getPath("async/move/d2/t7/fileAnotherDevice");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readFileSync(src);
                    fs.move(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst)).to.be.eql(original);
                        done();
                    });
                });
                test("should move folders across devices with EXDEV error", function (done) {
                    const src = common.getPath("async/move/d2/t9");
                    const dst = common.getPath("async/move/d2/t9dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readdirSync(src);
                    fs.move(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        done();
                    });
                });
                test("should move folders across devices with EXDEV error with stream", function (done) {
                    const src = common.getPath("async/move/d2/t11");
                    const dst = common.getPath("async/move/d2/t11dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readdirSync(src);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: fs.MoveStreamOutType = JSON.parse(chunk);
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
                    fs.move(src, dst, { stream: stream }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        expect(files).to.be.equal(2);
                        expect(dirs).to.be.equal(2);
                        done();
                    });
                });
            });
        });
        describe("> promises", function () {
            describe("> Stats", function () {
                test("stat uid and gid", async function () {
                    const stats = await fs.promises.stat(__filename);
                    expect(stats.uid).to.be.equal(0xfffffffe);
                    expect(stats.gid).to.be.equal(0xfffffffe);
                });
            });
            describe("> readdir", function () {
                test("should test readdir reorder", async function () {
                    const files = await fs.promises.readdir(__dirname);
                    expect(files).to.eql(["b", "c", "x"]);
                });
            });
            describe("> rmdir", function () {
                test("should fail when removing directory locked after rmdir timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/rmdir/folder2");
                    (fs as any).addLockRmDir(file);
                    expect(fs.promises.rmdir(file)).to.eventually.rejected.to.have.property("code", "EBUSY");
                });
                test("should remove directory when lock is released before rmdir timeout with maxRetries = 1", async function () {
                    const file = common.getPath("promises/rmdir/folder3");
                    (fs as any).addLockRmDir(file);
                    setTimeout(() => {
                        (fs as any).removeLockRmDir(file);
                    }, 20);
                    expect(fs.promises.rmdir(common.getPath("promises/rmdir/folder3"), { maxRetries: 1 })).to.eventually
                        .be.fulfilled;
                });
            });
            describe("> unlink", function () {
                test("should fail when removing file locked after unlink timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/unlink/file2");
                    (fs as any).addLockUnlink(file);
                    expect(fs.promises.unlink(file)).to.eventually.rejected.to.have.property("code", "EBUSY");
                });
                test("should remove file when lock is released before unlink timeout", async function () {
                    const file = common.getPath("promises/unlink/file3");
                    (fs as any).addLockUnlink(file);
                    setTimeout(() => {
                        (fs as any).removeLockUnlink(file);
                    }, 20);
                    expect(fs.promises.unlink(common.getPath("promises/unlink/file3"))).to.eventually.be.fulfilled;
                });
            });
            describe("> rename", function () {
                test("should fail when renaming locked file after rename timeout", async function () {
                    this.slow(200);
                    const file = common.getPath("promises/rename/file2.txt");
                    (fs as any).addLockRename(file);
                    expect(
                        fs.promises.rename(file, common.getPath("promises/rename/file2Renamed.txt"))
                    ).to.eventually.rejected.to.have.property("code", "EPERM");
                });
                test("should rename file when lock is released before rename timeout", async function () {
                    const file = common.getPath("promises/rename/file3.txt");
                    (fs as any).addLockRename(file);
                    setTimeout(() => {
                        (fs as any).removeLockRename(file);
                    }, 20);
                    expect(
                        fs.promises.rename(
                            common.getPath("promises/rename/file3.txt"),
                            common.getPath("promises/rename/file3Renamed.txt")
                        )
                    ).to.eventually.be.fulfilled;
                });
            });
            describe("> move", function () {
                test("should overwrite folders across devices", async function () {
                    const src = common.getPath("promises/move/d1/t3");
                    const dst = common.getPath("promises/move/d1/t3dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    await fs.promises.move(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should work across devices", async function () {
                    const src = common.getPath("promises/move/d2/t7/f1");
                    const dst = common.getPath("promises/move/d2/t7/fileAnotherDevice");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readFileSync(src);
                    await fs.promises.move(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error", async function () {
                    const src = common.getPath("promises/move/d2/t9");
                    const dst = common.getPath("promises/move/d2/t9dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readdirSync(src);
                    await fs.promises.move(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error with stream", async function () {
                    const src = common.getPath("promises/move/d2/t11");
                    const dst = common.getPath("promises/move/d2/t11dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readdirSync(src);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: fs.MoveStreamOutType = JSON.parse(chunk);
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
                    await fs.promises.move(src, dst, { stream: stream });
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                    expect(files).to.be.equal(2);
                    expect(dirs).to.be.equal(2);
                });
            });
        });
        describe("> sync", function () {
            describe("> Stats", function () {
                test("stat uid and gid", function () {
                    const stats = fs.statSync(__filename);
                    expect(stats.uid).to.be.equal(0xfffffffe);
                    expect(stats.gid).to.be.equal(0xfffffffe);
                });
            });
            describe("> readdir", function () {
                test("should test readdir reorder", function () {
                    const files = fs.readdirSync(__dirname);
                    expect(files).to.eql(["b", "c", "x"]);
                });
            });
            describe("> rmdir", function () {
                test("should fail when removing directory locked after rmdir timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/rmdir/folder2");
                    (fs as any).addLockRmDir(file);
                    expect(() => fs.rmdirSync(file))
                        .to.throw()
                        .to.have.property("code", "EBUSY");
                });
                test("should remove directory when lock is released before rmdir timeout with maxRetries = 1", function () {
                    const file = common.getPath("sync/rmdir/folder3");
                    (fs as any).addLockRmDir(file);
                    expect(() => fs.rmdirSync(file)).to.throw(/File locked by system/);
                    (fs as any).removeLockRmDir(file);
                    expect(() => fs.rmdirSync(file)).not.to.throw();
                });
            });
            describe("> unlink", function () {
                test("should fail when removing file locked after unlink timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/unlink/file2");
                    (fs as any).addLockUnlink(file);
                    expect(() => fs.unlinkSync(file))
                        .to.throw()
                        .to.have.property("code", "EBUSY");
                });
                test("should remove file when lock is released before unlink timeout", function () {
                    const file = common.getPath("sync/unlink/file3");
                    (fs as any).addLockUnlink(file);
                    expect(() => fs.unlinkSync(file)).to.throw(/File locked by system/);
                    (fs as any).removeLockUnlink(file);
                    expect(() => fs.unlinkSync(file)).not.to.throw();
                });
            });
            describe("> rename", function () {
                test("should fail when renaming locked file after rename timeout", function () {
                    this.slow(200);
                    const file = common.getPath("sync/rename/file2.txt");
                    (fs as any).addLockRename(file);
                    expect(() => fs.renameSync(file, common.getPath("sync/rename/file2Renamed.txt")))
                        .to.throw()
                        .to.have.property("code", "EPERM");
                });
                test("should rename file when lock is released before rename timeout", function () {
                    const file = common.getPath("sync/rename/file3.txt");
                    (fs as any).addLockRename(file);

                    expect((): void => fs.renameSync(file, common.getPath("sync/file3Renamed.txt"))).to.throw(
                        /File locked by system/
                    );
                    (fs as any).removeLockRename(file);
                    expect(() => fs.renameSync(file, common.getPath("sync/file3Renamed.txt"))).not.to.throw();
                });
            });
            describe("> move", function () {
                test("should overwrite folders across devices", function () {
                    const src = common.getPath("sync/move/d1/t3");
                    const dst = common.getPath("sync/move/d1/t3dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    fs.moveSync(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should work across devices", function () {
                    const src = common.getPath("sync/move/d2/t7/f1");
                    const dst = common.getPath("sync/move/d2/t7/fileAnotherDevice");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readFileSync(src);
                    fs.moveSync(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error", function () {
                    const src = common.getPath("sync/move/d2/t9");
                    const dst = common.getPath("sync/move/d2/t9dst");
                    (fs as any).addExdevRename(src);
                    (fs as any).addExdevRename(dst);
                    const original = fs.readdirSync(src);
                    fs.moveSync(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
            });
        });
    });
});
