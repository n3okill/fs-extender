import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);
import * as NodeCrypto from "crypto";

import * as fs from "../../src/patch/patch.js";
import * as compare from "../../src/compare/file.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    "file1.txt": "content 1",
    "file2.txt": "content 2",
    folder: {},
};

const common = new Common("fs-extender-compare-file", drive);

const MbSize = 10;

describe("fs-extender", function () {
    describe("> compare", function () {
        this.timeout(10000);
        async function prepareFiles(file: string, fileDiff: string): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let end1 = false,
                    end2 = false;

                function ended(): void {
                    if (end1 === true && end2 === true) {
                        resolve();
                    }
                }

                function createFiles(): void {
                    const stream1 = fs.createWriteStream(file);
                    const stream2 = fs.createWriteStream(fileDiff);
                    stream1.on("finish", (): void => {
                        end1 = true;
                        ended();
                    });
                    stream2.on("finish", (): void => {
                        end2 = true;
                        ended();
                    });

                    stream1.on("error", (err): void => {
                        stream2.destroy();
                        reject(err);
                    });
                    stream2.on("error", (err): void => {
                        stream1.destroy();
                        reject(err);
                    });

                    const size = 1024 * 1024; //Mb
                    const steps = MbSize; // 10Mb
                    const random1 = NodeCrypto.randomBytes(size);
                    const random2 = NodeCrypto.randomBytes(size);

                    let i = steps;
                    while (i-- > 1) {
                        stream1.write(random1);
                        stream2.write(random1);
                    }
                    stream1.write(random1);
                    stream2.write(random2);

                    stream1.end();
                    stream2.end();
                }

                createFiles();
            });
        }
        before(async function () {
            await common.beforeAll();
            return prepareFiles(common.getPath("file.txt") as string, common.getPath("fileDiff.txt") as string);
        });
        after(async () => common.afterAll());
        describe("> file", function () {
            describe("> async", function () {
                describe("> filesHash", function () {
                    describe("> small files", function () {
                        test("should compare two equal files", function (done) {
                            compare.filesHash(
                                common.getPath("file.txt"),
                                common.getPath("file.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.true;
                                    done();
                                }
                            );
                        });
                        test("should fail to compare two different files", function (done) {
                            compare.filesHash(
                                common.getPath("file.txt"),
                                common.getPath("file1.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.false;
                                    done();
                                }
                            );
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", function (done) {
                            compare.filesHash(
                                common.getPath("file.txt"),
                                common.getPath("file.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.true;
                                    done();
                                }
                            );
                        });
                        test("should fail to compare two different files", function (done) {
                            compare.filesHash(
                                common.getPath("file.txt"),
                                common.getPath("fileDiff.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.false;
                                    done();
                                }
                            );
                        });
                    });
                });
                describe("> filesByte", function () {
                    describe("> small files", function () {
                        test("should compare two equal files", function (done) {
                            compare.filesByte(
                                common.getPath("file.txt"),
                                common.getPath("file.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.true;
                                    done();
                                }
                            );
                        });
                        test("should fail to compare two different files", function (done) {
                            compare.filesByte(
                                common.getPath("file.txt"),
                                common.getPath("file1.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.false;
                                    done();
                                }
                            );
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", function (done) {
                            compare.filesByte(
                                common.getPath("file.txt"),
                                common.getPath("file.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.true;
                                    done();
                                }
                            );
                        });
                        test("should fail to compare two different files", function (done) {
                            compare.filesByte(
                                common.getPath("file.txt"),
                                common.getPath("fileDiff.txt"),
                                (err: NodeJS.ErrnoException, result: boolean): void => {
                                    expect(err).to.be.null;
                                    expect(result).to.be.false;
                                    done();
                                }
                            );
                        });
                    });
                });
            });
            describe("promise", function () {
                describe("filesHash", function () {
                    describe("small files", function () {
                        test("should compare two equal files", async function () {
                            expect(
                                await compare.promises.filesHash(common.getPath("file.txt"), common.getPath("file.txt"))
                            ).to.be.true;
                        });
                        test("should fail to compare two different files", async function () {
                            expect(
                                await compare.promises.filesHash(
                                    common.getPath("file.txt"),
                                    common.getPath("file1.txt")
                                )
                            ).to.be.false;
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", async function () {
                            expect(
                                await compare.promises.filesHash(common.getPath("file.txt"), common.getPath("file.txt"))
                            ).to.be.true;
                        });
                        test("should fail to compare two different files", async function () {
                            expect(
                                await compare.promises.filesHash(
                                    common.getPath("file.txt"),
                                    common.getPath("fileDiff.txt")
                                )
                            ).to.be.false;
                        });
                    });
                });
                describe("filesByte", function () {
                    describe("small files", function () {
                        test("should compare two equal files", async function () {
                            await expect(
                                compare.promises.filesByte(common.getPath("file.txt"), common.getPath("file.txt"))
                            ).to.eventually.be.fulfilled.to.be.true;
                        });
                        test("should fail to compare two different files", async function () {
                            expect(
                                await compare.promises.filesByte(
                                    common.getPath("file.txt"),
                                    common.getPath("file1.txt")
                                )
                            ).to.be.false;
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", async function () {
                            expect(
                                await compare.promises.filesByte(common.getPath("file.txt"), common.getPath("file.txt"))
                            ).to.be.true;
                        });
                        test("should fail to compare two different files", async function () {
                            expect(
                                await compare.promises.filesByte(
                                    common.getPath("file.txt"),
                                    common.getPath("fileDiff.txt")
                                )
                            ).to.be.false;
                        });
                    });
                });
            });
            describe("sync", function () {
                describe("filesHashSync", function () {
                    describe("small files", function () {
                        test("should compare two equal files", function () {
                            expect(compare.filesHashSync(common.getPath("file.txt"), common.getPath("file.txt"))).to.be
                                .true;
                        });
                        test("should fail to compare two different files", function () {
                            expect(compare.filesHashSync(common.getPath("file.txt"), common.getPath("file1.txt"))).to.be
                                .false;
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", function () {
                            expect(compare.filesHashSync(common.getPath("file.txt"), common.getPath("file.txt"))).to.be
                                .true;
                        });
                        test("should fail to compare two different files", function () {
                            expect(compare.filesHashSync(common.getPath("file.txt"), common.getPath("fileDiff.txt"))).to
                                .be.false;
                        });
                    });
                });
                describe("filesByteSync", function () {
                    describe("small files", function () {
                        test("should compare two equal files", function () {
                            expect(compare.filesByteSync(common.getPath("file.txt"), common.getPath("file.txt"))).to.be
                                .true;
                        });
                        test("should fail to compare two different files", function () {
                            expect(compare.filesByteSync(common.getPath("file.txt"), common.getPath("file1.txt"))).to.be
                                .false;
                        });
                    });
                    describe("big files", function () {
                        test("should compare two equal files", function () {
                            expect(compare.filesByteSync(common.getPath("file.txt"), common.getPath("file.txt"))).to.be
                                .true;
                        });
                        test("should fail to compare two different files", function () {
                            expect(compare.filesByteSync(common.getPath("file.txt"), common.getPath("fileDiff.txt"))).to
                                .be.false;
                        });
                    });
                });
            });
        });
    });
});
