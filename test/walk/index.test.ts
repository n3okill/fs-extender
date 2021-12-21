import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as fs from "../../src/patch";
import * as walk from "../../src/walk";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    "file1.txt": "content 1",
    "file2.txt": "content 2",
    folder: {
        subfolder: {
            "file.txt": "file sub folder",
        },
    },
    folder2: {
        "file.txt": "file folder 2",
    },
};

const common = new Common("fs-extender-compare-size", drive);

describe("fs-extender", function () {
    describe("> size", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> async", function () {
            test("should walk full path", function (done) {
                let files = 0;
                let dirs = 0;
                walk.walk(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    },
                    (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(files).to.be.equal(4);
                        expect(dirs).to.be.equal(4);
                        done();
                    }
                );
            });
            test("should walk full path with buffer path", function (done) {
                let files = 0;
                let dirs = 0;
                walk.walk(
                    Buffer.from(common.getPath("")),
                    (err: NodeJS.ErrnoException | null, path: string | Buffer, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    },
                    (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(files).to.be.equal(4);
                        expect(dirs).to.be.equal(4);
                        done();
                    }
                );
            });
            test("should throw an error", function (done) {
                walk.walk(
                    "file don't exist",
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (err) {
                            throw err;
                        }
                    },
                    (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.have.property("code", "ENOENT");
                        done();
                    }
                );
            });
            test("should walk and stop execution", function (done) {
                let files = 0;
                let dirs = 0;
                let count = 0;
                walk.walk(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                        if (++count === 6) {
                            return true;
                        }
                        return false;
                    },
                    (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(files).to.be.equal(2);
                        expect(dirs).to.be.equal(4);
                        done();
                    }
                );
            });
        });
        describe("> promises", function () {
            test("should walk full path", async function () {
                let files = 0;
                let dirs = 0;
                await walk.promises.walk(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    }
                );
                expect(files).to.be.equal(4);
                expect(dirs).to.be.equal(4);
            });
            test("should walk full path with buffer path", async function () {
                let files = 0;
                let dirs = 0;
                await walk.promises.walk(
                    Buffer.from(common.getPath("")),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    }
                );
                expect(files).to.be.equal(4);
                expect(dirs).to.be.equal(4);
            });
            test("should walk full path async walk function", async function () {
                let files = 0;
                let dirs = 0;
                await walk.promises.walk(
                    common.getPath(""),
                    async (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        return new Promise((resolve) => {
                            if (stats.isDirectory()) {
                                dirs++;
                            } else {
                                files++;
                            }
                            resolve();
                        });
                    }
                );
                expect(files).to.be.equal(4);
                expect(dirs).to.be.equal(4);
            });
            test("should throw an error", async function () {
                await expect(
                    walk.promises.walk(
                        "file don't exist",
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                            if (err) {
                                throw err;
                            }
                        }
                    )
                ).to.eventually.be.rejected.to.have.property("code", "ENOENT");
            });
            test("should throw an error async walk function", async function () {
                await expect(
                    walk.promises.walk(
                        "file don't exist",
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        async (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                            return new Promise((resolve, reject) => {
                                if (err) {
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    )
                ).to.eventually.be.rejected.to.have.property("code", "ENOENT");
            });
            test("should walk and stop execution", async function () {
                let files = 0;
                let dirs = 0;
                let count = 0;
                await walk.promises.walk(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                        if (++count === 6) {
                            return true;
                        }
                        return false;
                    }
                );

                expect(files).to.be.equal(2);
                expect(dirs).to.be.equal(4);
            });
            test("should walk and stop execution async walk function", async function () {
                let files = 0;
                let dirs = 0;
                let count = 0;
                await walk.promises.walk(
                    common.getPath(""),
                    async (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        return new Promise((resolve) => {
                            if (stats.isDirectory()) {
                                dirs++;
                            } else {
                                files++;
                            }
                            if (++count === 6) {
                                resolve(true);
                            }
                            resolve(false);
                        });
                    }
                );
                expect(files).to.be.equal(2);
                expect(dirs).to.be.equal(4);
            });
        });
        describe("> sync", function () {
            test("should walk full path", function () {
                let files = 0;
                let dirs = 0;
                walk.walkSync(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    }
                );
                expect(files).to.be.equal(4);
                expect(dirs).to.be.equal(4);
            });
            test("should walk full path with buffer path", function () {
                let files = 0;
                let dirs = 0;
                walk.walkSync(
                    Buffer.from(common.getPath("")),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                    }
                );
                expect(files).to.be.equal(4);
                expect(dirs).to.be.equal(4);
            });
            test("should throw an error", function () {
                expect(() =>
                    walk.walkSync(
                        "file don't exist",
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                            if (err) {
                                throw err;
                            }
                        }
                    )
                )
                    .to.throw()
                    .to.have.property("code", "ENOENT");
            });
            test("should walk and stop execution", function () {
                let files = 0;
                let dirs = 0;
                let count = 0;
                walk.walkSync(
                    common.getPath(""),
                    (err: NodeJS.ErrnoException | null, path: fs.PathLike, stats: fs.Stats) => {
                        if (stats.isDirectory()) {
                            dirs++;
                        } else {
                            files++;
                        }
                        if (++count === 6) {
                            return true;
                        }
                        return false;
                    }
                );
                expect(files).to.be.equal(2);
                expect(dirs).to.be.equal(4);
            });
        });
    });
});
