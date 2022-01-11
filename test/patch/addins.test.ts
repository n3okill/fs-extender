import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch/patch.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    "file.txt": "content",
    folder: {
        "file.txt": "content",
    },
};

const common = new Common("fs-extender-patch-addins", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> addins", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                describe("> existsAccess", function () {
                    function existAccess(path: fs.PathLike, result: boolean, done: fs.NoParamCallback): void {
                        fs.existAccess(path, (errAccess: NodeJS.ErrnoException | null, res: boolean): void => {
                            expect(errAccess).to.be.null;
                            expect(res).to.be.equal(result);
                            done(errAccess);
                        });
                    }
                    test("should test true for async file", function (done) {
                        existAccess(common.getPath("file.txt"), true, done);
                    });
                    test("should test true for async folder", function (done) {
                        existAccess(common.getPath("folder"), true, done);
                    });
                    test("should test false for async non-existent file or folder", function (done) {
                        existAccess(common.getPath("folder/not/existent/file"), false, done);
                    });
                });
                describe("> multiple methods of exist and is of type", function () {
                    const methods = ["statIsDirectory", "statIsFile", "statIsSymbolicLink"];
                    test("should test methods existence", function () {
                        methods.forEach((name): void => {
                            expect((fs as unknown as Record<string, CallableFunction>)[name]).to.be.a("function");
                        });
                    });
                    test("should test stat isDirectory method and it's result", function (done) {
                        fs.statIsDirectory(
                            common.getPath("file.txt"),
                            (errFile: NodeJS.ErrnoException | null, resultFile: boolean): void => {
                                expect(errFile).to.be.null;
                                expect(resultFile).to.be.false;
                                fs.statIsDirectory(
                                    common.getPath("folder"),
                                    (err: NodeJS.ErrnoException | null, result: boolean): void => {
                                        expect(err).to.be.null;
                                        expect(result).to.be.true;
                                        done();
                                    }
                                );
                            }
                        );
                    });
                    test("should test stat isFile method and it's result", function (done) {
                        fs.statIsFile(
                            common.getPath("file.txt"),
                            (err: NodeJS.ErrnoException | null, result: boolean): void => {
                                expect(err).to.be.null;
                                expect(result).to.be.true;
                                fs.statIsFile(
                                    common.getPath("folder"),
                                    (errDir: NodeJS.ErrnoException | null, resultDir: boolean): void => {
                                        expect(errDir).to.be.null;
                                        expect(resultDir).to.be.false;
                                        done();
                                    }
                                );
                            }
                        );
                    });
                });
                describe("> isEmpty", function () {
                    test("dir should not be empty", function (done) {
                        fs.isEmpty(__dirname, (err: NodeJS.ErrnoException | null, res: boolean) => {
                            expect(err).to.be.null;
                            expect(res).to.be.false;
                            done();
                        });
                    });
                    test("file should not be empty", function (done) {
                        fs.isEmpty(__filename, (err: NodeJS.ErrnoException | null, res: boolean) => {
                            expect(err).to.be.null;
                            expect(res).to.be.false;
                            done();
                        });
                    });
                    test("should throw error when file don't exist", function (done) {
                        fs.isEmpty("don't exist", (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.not.be.null;
                            expect(err).to.have.property("code", "ENOENT");
                            done();
                        });
                    });
                });
            });
            describe("> promises", function () {
                describe("> existAccess", function () {
                    test("should test true for promise file", async function () {
                        expect(await fs.promises.existAccess(common.getPath("file.txt"))).to.be.true;
                    });
                    test("should test false for promise non-existent file", async function () {
                        expect(await fs.promises.existAccess(common.getPath("not/existent/file"))).to.be.false;
                    });
                });
                describe("> multiple methods of exist and is of type", function () {
                    test("should test stat isDirectory method and it's result with promise", async function () {
                        expect((await fs.promises.statIsDirectory(common.getPath("folder"))).isType).to.be.true;
                        expect((await fs.promises.statIsDirectory(common.getPath("file.txt"))).isType).to.be.false;
                    });
                    test("should test stat isFile method and it's result with promise", async function () {
                        expect((await fs.promises.statIsFile(common.getPath("file.txt"))).isType).to.be.true;
                        expect((await fs.promises.statIsFile(common.getPath("folder"))).isType).to.be.false;
                    });
                });
                describe("> isEmpty", function () {
                    test("dir should not be empty", async function () {
                        await expect(fs.promises.isEmpty(__dirname)).to.be.eventually.fulfilled.to.be.false;
                    });
                    test("file should not be empty", async function () {
                        await expect(fs.promises.isEmpty(__filename)).to.be.eventually.fulfilled.to.be.false;
                    });
                    test("should throw error when file don't exist", async function () {
                        await expect(fs.promises.isEmpty("don't exist")).to.eventually.rejected.to.have.property(
                            "code",
                            "ENOENT"
                        );
                    });
                });
            });
            describe("> sync", function () {
                describe("> existAccess", function () {
                    test("should test true for sync file", function () {
                        expect(fs.existAccessSync(common.getPath("file.txt"))).to.be.true;
                    });
                    test("should test false for sync non-existent file", function () {
                        expect(fs.existAccessSync(common.getPath("not/existent/file"))).to.be.false;
                    });
                });
                describe("> multiple methods of exist and is of type", function () {
                    const methods = ["statIsDirectorySync", "statIsFileSync", "statIsSymbolicLinkSync"];
                    test("should test methods existence", function () {
                        methods.forEach((item: string) => {
                            expect((fs as never)[item]).to.be.a("function");
                        });
                    });
                    test("should test stat isDirectory method and it's result", function () {
                        expect(fs.statIsDirectorySync(common.getPath("folder"))).to.be.true;
                        expect(fs.statIsDirectorySync(common.getPath("file.txt"))).to.be.false;
                    });
                    test("should test stat isFile method and it's result", function () {
                        expect(fs.statIsFileSync(common.getPath("file.txt"))).to.be.true;
                        expect(fs.statIsFileSync(common.getPath("folder"))).to.be.false;
                    });
                });
                describe("> isEmpty", function () {
                    test("dir should not be empty", function () {
                        expect(fs.isEmptySync(__dirname)).to.be.false;
                    });
                    test("file should not be empty", function () {
                        expect(fs.isEmptySync(__filename)).to.be.false;
                    });
                    test("should throw error when file don't exist", function () {
                        expect(() => fs.isEmptySync("don't exist"))
                            .to.throw()
                            .to.have.property("code", "ENOENT");
                    });
                });
            });
        });
    });
});
