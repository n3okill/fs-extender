import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as find from "../../src/find/index.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    "file.txt": "content",
    "file1.txt": "content 1",
    "content.txt": "content 2",
};

const common = new Common("fs-extender-find", drive);

describe("fs-extender", function () {
    describe("> find", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> success", function () {
            describe("> async", function () {
                test("no filter", function (done) {
                    find.find(common.getPath(""), (err, list): void => {
                        expect(err).to.be.null;
                        expect(list).to.have.length(4);
                        done();
                    });
                });
                test("regex filter", function (done) {
                    find.find(common.getPath(""), /file/gi, (err, list): void => {
                        expect(err).to.be.null;
                        expect(list).to.have.length(2);
                        done();
                    });
                });
                test("function filter", function (done) {
                    find.find(
                        common.getPath(""),
                        { filter: (path): boolean => /file/gi.test(path) },
                        (err, list): void => {
                            expect(list).to.have.length(2);
                            done();
                        }
                    );
                });
                test("no filter with buffer path", function (done) {
                    find.find(common.getPath(Buffer.from("")), (err, list): void => {
                        expect(err).to.be.null;
                        expect(list).to.have.length(4);
                        expect(Buffer.isBuffer(list[0].path)).to.be.true;
                        done();
                    });
                });
                test("regex filter with buffer path", function (done) {
                    find.find(common.getPath(Buffer.from("")), /file/gi, (err, list): void => {
                        expect(err).to.be.null;
                        expect(list).to.have.length(2);
                        expect(Buffer.isBuffer(list[0].path)).to.be.true;
                        done();
                    });
                });
                test("function filter with buffer option", function (done) {
                    find.find(
                        common.getPath(""),
                        {
                            encoding: "buffer",
                            filter: (path): boolean => /file/gi.test(path.toString()),
                        },
                        (err, list): void => {
                            expect(list).to.have.length(2);
                            expect(Buffer.isBuffer(list[0].path)).to.be.true;
                            done();
                        }
                    );
                });
            });
            describe("> promise", function () {
                test("no filter", async function () {
                    expect(find.promises.find(common.getPath(""))).to.eventually.be.fulfilled.to.have.length(4);
                });
                test("regex filter", async function () {
                    expect(find.promises.find(common.getPath(""), /file/gi)).to.eventually.be.fulfilled.to.have.length(
                        2
                    );
                });
                test("function filter", async function () {
                    expect(
                        find.promises.find(common.getPath(""), {
                            filter: (path): boolean => /file/gi.test(path),
                        })
                    ).to.eventually.fulfilled.to.have.length(2);
                });
                test("no filter with buffer path", async function () {
                    const list = await find.promises.find(common.getPath(Buffer.from("")));
                    expect(list).to.have.length(4);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
                test("regex filter with buffer path", async function () {
                    const list = await find.promises.find(common.getPath(Buffer.from("")), /file/gi);
                    expect(list).to.have.length(2);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
                test("function filter with buffer option", async function () {
                    const list = await find.promises.find(common.getPath(""), {
                        encoding: "buffer",
                        filter: (path): boolean => /file/gi.test(path.toString()),
                    });
                    expect(list).to.have.length(2);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
            });
            describe("> sync", function () {
                test("no filter", function () {
                    expect(find.findSync(common.getPath(""))).to.have.length(4);
                });
                test("regex filter", function () {
                    expect(find.findSync(common.getPath(""), /file/gi)).to.have.length(2);
                });
                test("function filter", function () {
                    expect(
                        find.findSync(common.getPath(""), {
                            filter: (path): boolean => /file/gi.test(path),
                        })
                    ).to.have.length(2);
                });
                test("no filter with buffer path", function () {
                    const list = find.findSync(common.getPath(Buffer.from("")));
                    expect(list).to.have.length(4);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
                test("regex filter with buffer path", function () {
                    const list = find.findSync(common.getPath(Buffer.from("")), /file/gi);
                    expect(list).to.have.length(2);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
                test("function filter with buffer option", function () {
                    const list = find.findSync(common.getPath(""), {
                        encoding: "buffer",
                        filter: (path): boolean => /file/gi.test(path.toString()),
                    });
                    expect(list).to.have.length(2);
                    expect(Buffer.isBuffer(list[0].path)).to.be.true;
                });
            });
        });
        describe("> throw error", function () {
            describe("> async", function () {
                test("should throw", function (done) {
                    find.find("./don't exist", (err: NodeJS.ErrnoException | null): void => {
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                        done();
                    });
                });
                test("don't throw with ignore access error", function (done) {
                    find.find("./don't exist", { ignoreAccessError: true }, (err, result): void => {
                        expect(err).to.be.null;
                        expect(result).to.have.length(0);
                        done();
                    });
                });
                test("should throw with buffer path", function (done) {
                    find.find(Buffer.from("./don't exist"), (err: NodeJS.ErrnoException | null): void => {
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                        done();
                    });
                });
                test("don't throw with ignore access error with buffer path", function (done) {
                    find.find(Buffer.from("./don't exist"), { ignoreAccessError: true }, (err, result): void => {
                        expect(err).to.be.null;
                        expect(result).to.have.length(0);
                        done();
                    });
                });
            });
            describe("> promise", function () {
                test("should throw", async function () {
                    expect(find.promises.find("./don't exist")).to.eventually.rejectedWith(/ENOENT/);
                });
                test("don't throw with ignore access error", async function () {
                    expect(
                        await find.promises.find("./don't exist", {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
                test("should throw with buffer path", async function () {
                    expect(find.promises.find(Buffer.from("./don't exist"))).to.eventually.rejectedWith(/ENOENT/);
                });
                test("don't throw with ignore access error with buffer path", async function () {
                    expect(
                        await find.promises.find(Buffer.from("./don't exist"), {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
            });
            describe("> sync", function () {
                test("should throw", function () {
                    expect(() => find.findSync("./don't exist")).to.throw(/ENOENT/);
                });
                test("don't throw with ignore access error", function () {
                    expect(
                        find.findSync("./don't exist", {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
                test("should throw with buffer path", function () {
                    expect(() => find.findSync(Buffer.from("./don't exist"))).to.throw(/ENOENT/);
                });
                test("don't throw with ignore access error with buffer path", function () {
                    expect(
                        find.findSync(Buffer.from("./don't exist"), {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
            });
        });
    });
});
