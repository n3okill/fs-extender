import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as compare from "../../src/compare/dir";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    folder1: {
        "file1.txt": "content 1",
        "file2.txt": "content 2",
    },
    folder2: {
        "file1.txt": "file 1",
        "file2.txt": "file 2",
    },
};

const common = new Common("fs-extender-compare-dir", drive);

describe("fs-extender", function () {
    describe("> compare", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> dir", function () {
            describe("> async", function () {
                describe("> dirHash", function () {
                    test("should compare two equal directories", function (done) {
                        compare.dirHash(
                            common.getPath("folder1"),
                            common.getPath("folder1"),
                            (err: NodeJS.ErrnoException, result: boolean): void => {
                                expect(err).to.be.null;
                                expect(result).to.be.true;
                                done();
                            }
                        );
                    });
                    test("should fail to compare two different directories", function (done) {
                        compare.dirHash(
                            common.getPath("folder1"),
                            common.getPath("folder2"),
                            (err: NodeJS.ErrnoException, result: boolean): void => {
                                expect(err).to.be.null;
                                expect(result).to.be.false;
                                done();
                            }
                        );
                    });
                    test("should fail to compare dir and file", function (done) {
                        compare.dirHash(
                            common.getPath("folder1"),
                            common.getPath(["folder1", "file1.txt"]),
                            { ignoreError: true },
                            (err: NodeJS.ErrnoException | null, res: boolean) => {
                                expect(err).to.be.null;
                                expect(res).to.be.false;
                                done();
                            }
                        );
                    });
                });
                describe("> dirByte", function () {
                    test("should compare two equal directories", function (done) {
                        compare.dirByte(
                            common.getPath("folder1"),
                            common.getPath("folder1"),
                            (err: NodeJS.ErrnoException, result: boolean): void => {
                                expect(err).to.be.null;
                                expect(result).to.be.true;
                                done();
                            }
                        );
                    });
                    test("should fail to compare two different directories", function (done) {
                        compare.dirByte(
                            common.getPath("folder1"),
                            common.getPath("folder2"),
                            (err: NodeJS.ErrnoException, result: boolean): void => {
                                expect(err).to.be.null;
                                expect(result).to.be.false;
                                done();
                            }
                        );
                    });
                });
            });
            describe("> promises", function () {
                describe("> dirHash", function () {
                    test("should compare two equal directories", async function () {
                        expect(await compare.promises.dirHash(common.getPath("folder1"), common.getPath("folder1"))).to
                            .be.true;
                    });
                    test("should fail to compare two different directories", async function () {
                        expect(await compare.promises.dirHash(common.getPath("folder1"), common.getPath("folder2"))).to
                            .be.false;
                    });
                    test("should fail to compare dir and file", async function () {
                        expect(
                            await compare.promises.dirHash(
                                common.getPath("folder1"),
                                common.getPath(["folder1", "file1.txt"]),
                                { ignoreError: true }
                            )
                        ).to.be.false;
                    });
                });
                describe("> dirByte", function () {
                    test("should compare two equal directories", async function () {
                        expect(await compare.promises.dirByte(common.getPath("folder1"), common.getPath("folder1"))).to
                            .be.true;
                    });
                    test("should fail to compare two different directories", async function () {
                        expect(await compare.promises.dirByte(common.getPath("folder1"), common.getPath("folder2"))).to
                            .be.false;
                    });
                });
            });
            describe("> sync", function () {
                describe("> dirHashSync", function () {
                    test("should compare two equal directories", function () {
                        expect(compare.dirHashSync(common.getPath("folder1"), common.getPath("folder1"))).to.be.true;
                    });
                    test("should fail to compare two different directories", function () {
                        expect(compare.dirHashSync(common.getPath("folder1"), common.getPath("folder2"))).to.be.false;
                    });
                    test("should fail to compare dir and file", function () {
                        expect(
                            compare.dirHashSync(common.getPath("folder1"), common.getPath(["folder1", "file1.txt"]), {
                                ignoreError: true,
                            })
                        ).to.be.false;
                    });
                });
                describe("> dirByteSync", function () {
                    test("should compare two equal directories", function () {
                        expect(compare.dirByteSync(common.getPath("folder1"), common.getPath("folder1"))).to.be.true;
                    });
                    test("should fail to compare two different directories", function () {
                        expect(compare.dirByteSync(common.getPath("folder1"), common.getPath("folder2"))).to.be.false;
                    });
                });
            });
        });
    });
});
