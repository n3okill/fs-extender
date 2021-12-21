import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { after, before, describe, test } from "mocha";
import * as list from "../../src/list";
import { Common, TestDirStructure } from "../Common";
use(chaiAsPromised);

const drive: TestDirStructure = {
    success: {
        "file.txt": "content",
        "file1.txt": "content 1",
        "file2.txt": "content 2",
        folder: {},
    },
    deep: {
        "file.txt": "content",
        "file1.txt": "content 1",
        "file2.txt": "content 2",
        folder: {
            "f1.txt": "c 1",
            "f2.txt": "c 2",
            folder2: {
                "f3.txt": "c 3",
                "f4.txt": "c 4",
            },
        },
    },
};

const common = new Common("fs-extender-list", drive);

describe("fs-extender", function () {
    describe("> list", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> success", function () {
            describe("> async", function () {
                test("string path", function (done) {
                    list.list(common.getPath("success"), (err, items): void => {
                        expect(err).to.be.null;
                        expect(items).to.have.length(5);
                        done();
                    });
                });
                test("buffer path", function (done) {
                    list.list(common.getPath(Buffer.from("success")), (err, items): void => {
                        expect(err).to.be.null;
                        expect(items).to.have.length(5);
                        expect(Buffer.isBuffer(items[0].path)).to.be.true;
                        done();
                    });
                });
                test("buffer option true", function (done) {
                    list.list(common.getPath("success"), { encoding: "buffer" }, (err, items): void => {
                        expect(err).to.be.null;
                        expect(items).to.have.length(5);
                        expect(Buffer.isBuffer(items[0].path)).to.be.true;
                        done();
                    });
                });
            });
            describe("> promise", function () {
                test("string path", async function () {
                    const result = await list.promises.list(common.getPath("success"));
                    expect(result).to.have.length(5);
                });
                test("buffer path", async function () {
                    const result = await list.promises.list(common.getPath(Buffer.from("success")));
                    expect(result).to.have.length(5);
                    expect(Buffer.isBuffer(result[0].path)).to.be.true;
                });
                test("buffer option true", async function () {
                    const result = await list.promises.list(common.getPath("success"), { encoding: "buffer" });
                    expect(result).to.have.length(5);
                    expect(Buffer.isBuffer(result[0].path)).to.be.true;
                });
            });
            describe("> sync", function () {
                test("string path", function () {
                    const result = list.listSync(common.getPath("success"));
                    expect(result).to.have.length(5);
                });
                test("buffer path", function () {
                    const result = list.listSync(common.getPath(Buffer.from("success")));
                    expect(result).to.have.length(5);
                    expect(Buffer.isBuffer(result[0].path)).to.be.true;
                });
                test("buffer option true", function () {
                    const result = list.listSync(common.getPath("success"), {
                        encoding: "buffer",
                    });
                    expect(result).to.have.length(5);
                    expect(Buffer.isBuffer(result[0].path)).to.be.true;
                });
            });
        });
        describe("> throw error", function () {
            describe("> async", function () {
                test("should throw", function (done) {
                    list.list("./don't exist", (err: NodeJS.ErrnoException | null): void => {
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                        done();
                    });
                });
                test("should throw with buffer", function (done) {
                    list.list(Buffer.from("./don't exist"), (err: NodeJS.ErrnoException | null): void => {
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                        done();
                    });
                });
                test("don't throw with ignore access error", function (done) {
                    list.list(
                        "./don't exist",
                        { ignoreAccessError: true },
                        (err: NodeJS.ErrnoException | null, result): void => {
                            expect(err).to.be.null;
                            expect(result).to.have.length(0);
                            done();
                        }
                    );
                });
                test("don't throw with ignore access error and buffer path", function (done) {
                    list.list(
                        Buffer.from("./don't exist"),
                        { ignoreAccessError: true },
                        (err: NodeJS.ErrnoException | null, result): void => {
                            expect(err).to.be.null;
                            expect(result).to.have.length(0);
                            done();
                        }
                    );
                });
            });
            describe("> promise", function () {
                test("should throw", async function () {
                    expect(list.promises.list("./don't exist")).to.eventually.rejectedWith(/ENOENT/);
                });
                test("don't throw with ignore access error", async function () {
                    expect(
                        await list.promises.list("./don't exist", {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
                test("should throw with buffer path", async function () {
                    expect(list.promises.list(Buffer.from("./don't exist"))).to.eventually.rejectedWith(/ENOENT/);
                });
                test("don't throw with ignore access error with buffer path", async function () {
                    expect(
                        await list.promises.list(Buffer.from("./don't exist"), {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
            });
            describe("> sync", function () {
                test("should throw", function () {
                    expect(() => list.listSync("./don't exist")).to.throw(/ENOENT/);
                });
                test("don't throw with ignore access error", function () {
                    expect(
                        list.listSync("./don't exist", {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
                test("should throw with buffer path", function () {
                    expect(() => list.listSync(Buffer.from("./don't exist"))).to.throw(/ENOENT/);
                });
                test("don't throw with ignore access error and buffer path", function () {
                    expect(
                        list.listSync(Buffer.from("./don't exist"), {
                            ignoreAccessError: true,
                        })
                    ).to.have.length(0);
                });
            });
        });
        describe("> depth", function () {
            const depth = [{ depth: 0 }, { depth: 1 }, { depth: 2 }];
            const results = [5, 8, 10];
            describe("> async", function () {
                test("depth 0", function (done) {
                    list.list(common.getPath("deep"), depth[0], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[0]);
                        done();
                    });
                });
                test("depth 1", function (done) {
                    list.list(common.getPath("deep"), depth[1], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[1]);
                        done();
                    });
                });
                test("depth 2", function (done) {
                    list.list(common.getPath("deep"), depth[2], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[2]);
                        done();
                    });
                });
                test("depth 0 with buffer path", function (done) {
                    list.list(common.getPath(Buffer.from("deep")), depth[0], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[0]);
                        done();
                    });
                });
                test("depth 1 with buffer path", function (done) {
                    list.list(common.getPath(Buffer.from("deep")), depth[1], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[1]);
                        done();
                    });
                });
                test("depth 2 with buffer path", function (done) {
                    list.list(common.getPath(Buffer.from("deep")), depth[2], (err, fileList): void => {
                        expect(err).to.be.null;
                        expect(fileList).to.have.length(results[2]);
                        done();
                    });
                });
            });
            describe("> promise", function () {
                test("depth 0", async function () {
                    expect(await list.promises.list(common.getPath("deep"), depth[0])).to.have.length(results[0]);
                });
                test("depth 1", async function () {
                    expect(await list.promises.list(common.getPath("deep"), depth[1])).to.have.length(results[1]);
                });
                test("depth 2", async function () {
                    expect(await list.promises.list(common.getPath("deep"), depth[2])).to.have.length(results[2]);
                });
                test("depth 0 with buffer path", async function () {
                    expect(await list.promises.list(common.getPath(Buffer.from("deep")), depth[0])).to.have.length(
                        results[0]
                    );
                });
                test("depth 1 with buffer path", async function () {
                    expect(await list.promises.list(common.getPath(Buffer.from("deep")), depth[1])).to.have.length(
                        results[1]
                    );
                });
                test("depth 2 with buffer path", async function () {
                    expect(await list.promises.list(common.getPath(Buffer.from("deep")), depth[2])).to.have.length(
                        results[2]
                    );
                });
            });
            describe("> sync", function () {
                test("depth 0", function () {
                    expect(list.listSync(common.getPath("deep"), depth[0])).to.have.length(results[0]);
                });
                test("depth 1", function () {
                    expect(list.listSync(common.getPath("deep"), depth[1])).to.have.length(results[1]);
                });
                test("depth 2", function () {
                    expect(list.listSync(common.getPath("deep"), depth[2])).to.have.length(results[2]);
                });
                test("depth 0 with buffer path", function () {
                    expect(list.listSync(common.getPath(Buffer.from("deep")), depth[0])).to.have.length(results[0]);
                });
                test("depth 1 with buffer path", function () {
                    expect(list.listSync(common.getPath(Buffer.from("deep")), depth[1])).to.have.length(results[1]);
                });
                test("depth 2 with buffer path", function () {
                    expect(list.listSync(common.getPath(Buffer.from("deep")), depth[2])).to.have.length(results[2]);
                });
            });
        });
    });
});
