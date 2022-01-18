import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch/patch";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    async: {
        "file.txt": "content",
        folder: {},
    },
    promises: {
        "file.txt": "content",
        folder: {},
    },
    sync: {
        "file.txt": "content",
        folder: {},
    },
};

const common = new Common("fs-extender-patch-permissions", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> permissions", function () {
            let umask: number;
            before(async function () {
                umask = process.umask(0);
                return common.beforeAll();
            });
            after(async function () {
                process.umask(umask);
                return common.afterAll();
            });
            const _0777 = 0o777; // parseInt("0777", 8);  //511
            const _0744 = 0o744; //parseInt("0744", 8);  //484
            const _0666 = 0o666; //parseInt("0666", 8);  //434
            describe("> async", function () {
                describe("> chmod", function () {
                    test("file", function (done) {
                        fs.stat(
                            common.getPath("async/file.txt"),
                            (err: NodeJS.ErrnoException | null, stats: fs.Stats): void => {
                                expect(stats.mode & 0o777).to.be.equal(_0666);
                                fs.chmod(
                                    common.getPath("async/file.txt"),
                                    _0744,
                                    (errChmod: NodeJS.ErrnoException | null): void => {
                                        expect(errChmod).to.be.null;
                                        fs.stat(
                                            common.getPath("async/file.txt"),
                                            (errStat2: NodeJS.ErrnoException | null, stats2: fs.Stats): void => {
                                                expect(stats2.mode & _0777).to.be.equal(
                                                    common.IsWindows ? _0666 : _0744
                                                );
                                                done();
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                    test("folder", function (done) {
                        fs.stat(
                            common.getPath("async/folder"),
                            (err: NodeJS.ErrnoException | null, stat: fs.Stats): void => {
                                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
                                fs.chmod(
                                    common.getPath("async/folder"),
                                    _0744,
                                    (errChmod: NodeJS.ErrnoException | null): void => {
                                        expect(errChmod).to.to.be.null;
                                        fs.stat(
                                            common.getPath("async/folder"),
                                            (errStat2: NodeJS.ErrnoException | null, stat2: fs.Stats): void => {
                                                expect(stat2.mode & _0777).to.be.equal(
                                                    common.IsWindows ? _0666 : _0744
                                                );
                                                done();
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    });
                });
            });
            describe("> promises", function () {
                describe("> chmod", function () {
                    test("file", async function () {
                        const stat = await fs.promises.stat(common.getPath("promises/file.txt"));
                        expect(stat.mode & _0777).to.be.equal(_0666);
                        await fs.promises.chmod(common.getPath("promises/file.txt"), _0744);
                        const stat2 = await fs.promises.stat(common.getPath("promises/file.txt"));
                        expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    });
                    test("folder", async function () {
                        const folder = common.getPath(["promises", "folder"]);
                        const stat = await fs.promises.stat(folder);
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
                        await fs.promises.chmod(folder, _0744);
                        const stat2 = await fs.promises.stat(folder);
                        expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    });
                });
            });
            describe("> sync", function () {
                describe("> chmod", function () {
                    test("file", function () {
                        expect(fs.statSync(common.getPath("sync/file.txt")).mode & _0777).to.be.equal(_0666);
                        fs.chmodSync(common.getPath("sync/file.txt"), _0744);
                        expect(fs.statSync(common.getPath("sync/file.txt")).mode & _0777).to.be.equal(
                            common.IsWindows ? _0666 : _0744
                        );
                    });
                    test("folder", function () {
                        const folder = common.getPath(["sync", "folder"]);
                        expect(fs.statSync(folder).mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
                        fs.chmodSync(folder, _0744);
                        expect(fs.statSync(folder).mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    });
                });
            });
        });
    });
});
