import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);
import { Type } from "@n3okill/utils";
import rewiremock from "rewiremock";

import * as fs from "../../src/patch/patch.js";
import * as move from "../../src/move/index.js";
import { Common, TestDirStructure } from "../Common.js";
import { Readable } from "stream";

const drive: TestDirStructure = {
    async: {
        d1: {
            t1: "t1",
            t1b: "t1b",
            t1dst: "t1dst",
            t1bdst: "t1bdst",
            t2: {
                f1: "f1",
            },
            t2dst: {
                f2: "f2",
            },
            t2b: {
                f1: "f1",
            },
            t2bdst: {
                f2: "f2",
            },
            t3: {
                f1: "f1",
            },
            t3dst: {
                f2: "f2",
            },
            t4: {
                f1: "f1",
            },
            t4dst: {
                f2: "f2",
            },
        },
        d2: {
            t1: {
                f1: "f1",
            },
            t2: {
                f1: "f1",
            },
            t3: {},
            t4: {},
            t5: {
                f1: "f1",
                f1dst: "f1dst",
            },
            t6: {
                f1: "f1",
            },
            t7: {
                f1: "f1",
            },
            t8: {
                f1: "f1",
                f2: "f2",
            },
            t9: {
                f1: "f1",
            },
            t10: {
                f1: "f1",
                f2: "f2",
            },
            t11: {
                f1: "f1",
            },
        },
        d3: {
            d1: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
            },
            d2: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
                t2: {
                    file1: "file1",
                },
                t2dst: {
                    file2: "file2",
                },
            },
        },
    },
    promises: {
        d1: {
            t1: "t1",
            t1dst: "t1dst",
            t1b: "t1b",
            t1bdst: "t1bdst",
            t2: {
                f1: "f1",
            },
            t2dst: {
                f2: "f2",
            },
            t2b: {
                f1: "f1",
            },
            t2bdst: {
                f2: "f2",
            },
            t3: {
                f1: "f1",
            },
            t3dst: {
                f2: "f2",
            },
            t4: {
                f1: "f1",
            },
            t4dst: {
                f2: "f2",
            },
        },
        d2: {
            t1: {
                f1: "f1",
            },
            t2: {
                f1: "f1",
            },
            t3: {},
            t4: {},
            t5: {
                f1: "f1",
                f1dst: "f1dst",
            },
            t6: {
                f1: "f1",
            },
            t7: {
                f1: "f1",
            },
            t8: {
                f1: "f1",
                f2: "f2",
            },
            t9: {
                f1: "f1",
            },
            t10: {
                f1: "f1",
                f2: "f2",
            },
            t11: {
                f1: "f1",
            },
        },
        d3: {
            d1: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
            },
            d2: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
                t2: {
                    file1: "file1",
                },
                t2dst: {
                    file2: "file2",
                },
            },
        },
    },
    sync: {
        d1: {
            t1: "t1",
            t1dst: "t1dst",
            t1b: "t1b",
            t1bdst: "t1bdst",

            t2: {
                f1: "f1",
            },
            t2dst: {
                f2: "f2",
            },
            t2b: {
                f1: "f1",
            },
            t2bdst: {
                f2: "f2",
            },
            t3: {
                f1: "f1",
            },
            t3dst: {
                f2: "f2",
            },
            t4: {
                f1: "f1",
            },
            t4dst: {
                f2: "f2",
            },
        },
        d2: {
            t1: {
                f1: "f1",
            },
            t2: {
                f1: "f1",
            },
            t3: {},
            t4: {},
            t5: {
                f1: "f1",
                f1dst: "f1dst",
            },
            t6: {
                f1: "f1",
            },
            t7: {
                f1: "f1",
            },
            t8: {
                f1: "f1",
                f2: "f2",
            },
            t9: {
                f1: "f1",
            },
        },
        d3: {
            d1: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
            },
            d2: {
                t1: {
                    file: "file",
                },
                t1dst: {
                    file: "content",
                },
                t2: {
                    file1: "file1",
                },
                t2dst: {
                    file2: "file2",
                },
            },
        },
    },
};
const mockMove = rewiremock.proxy(
    () => require("../../src/move/index"),
    (r) => ({
        "../patch": r
            .callThrough()
            .toBeUsed()
            .with({
                rename: function (a: unknown, b: unknown, cb: CallableFunction) {
                    const e: NodeJS.ErrnoException = new Error();
                    e.code = "EXDEV";
                    cb(e);
                },
                renameSync: function () {
                    const e: NodeJS.ErrnoException = new Error();
                    e.code = "EXDEV";
                    throw e;
                },
                promises: {
                    mkdir: fs.promises.mkdir,
                    lstat: fs.promises.lstat,
                    stat: fs.promises.stat,
                    readdir: fs.promises.readdir,
                    chmod: fs.promises.chmod,
                    rmdir: fs.promises.rmdir,
                    unlink: fs.promises.unlink,
                    open: fs.promises.open,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    rename: async function rename(oldPath: unknown, newPath: unknown): Promise<void> {
                        const e: NodeJS.ErrnoException = new Error();
                        e.code = "EXDEV";
                        throw e;
                    },
                },
            }),
    })
);
const common = new Common("fs-extender-move", drive);

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

type TError = NodeJS.ErrnoException | null;

describe("fs-extender", function () {
    describe("> move", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> async", function () {
            describe("> when overwrite = true", function () {
                test("should overwrite file", function (done) {
                    const src = getPath("async", "d1/t1");
                    const dst = getPath("async", "d1/t1dst");
                    expect(fs.existsSync(dst)).to.be.true;
                    move.move(src, dst, { overwrite: true }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1");
                        done();
                    });
                });
                test("should overwrite file with buffer path", function (done) {
                    const src = Buffer.from(getPath("async", "d1/t1b"));
                    const dst = getPath("async", "d1/t1bdst");
                    expect(fs.existsSync(dst)).to.be.true;
                    move.move(src, dst, { overwrite: true }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1b");
                        done();
                    });
                });
                test("should overwrite the destination directory", function (done) {
                    const src = getPath("async", "d1/t2");
                    const dst = getPath("async", "d1/t2dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    move.move(src, dst, { overwrite: true }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(src)).to.be.false;
                        expect(fs.existsSync(dst + "/f1")).to.be.true;
                        done();
                    });
                });
                test("should overwrite the destination directory with buffer path", function (done) {
                    const src = Buffer.from(getPath("async", "d1/t2b"));
                    const dst = getPath("async", "d1/t2bdst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    move.move(src, dst, { overwrite: true }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(src)).to.be.false;
                        expect(fs.existsSync(dst + "/f1")).to.be.true;
                        done();
                    });
                });
                test("should overwrite folders across devices", (done) => {
                    const src = getPath("async", "d1/t3");
                    const dst = getPath("async", "d1/t3dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    mockMove.move(src, dst, { overwrite: true }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(src)).to.be.false;
                        expect(fs.existsSync(dst + "/f1")).to.be.true;
                        done();
                    });
                });
                test("should overwrite the destination", function (done) {
                    const src = getPath("async", "d1/t4");
                    const dst = getPath("async", "d1/t4dst");
                    const original = fs.readdirSync(src);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(["f2"]);
                    expect(original as unknown[]).to.be.eql(["f1"]);
                    move.move(src, dst, { overwrite: true }, () => {
                        const filesDst = fs.readdirSync(dst);
                        expect(filesDst as never[]).to.be.eql(original as never[]);
                        //dst should not have old stuff
                        expect(filesDst as unknown[]).not.to.be.eql(["f2"]);
                        //dst should have new stuff
                        expect(filesDst as unknown[]).to.be.eql(["f1"]);
                        done();
                    });
                });
            });
            describe("> when overwrite = false (default)", function () {
                test("should rename a file on the same device", function (done) {
                    const src = getPath("async", "d2/t1/f1");
                    const dst = getPath("async", "d2/t1/f1dst");
                    const original = fs.readFileSync(src);
                    move.move(src, dst, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst)).to.be.eql(original);
                        done();
                    });
                });
                test("should not move a file if source and destination are the same", function (done) {
                    const src = getPath("async", "d2/t2/f1");
                    const dst = src;
                    move.move(src, dst, (err: TError) => {
                        expect(err).not.to.be.null;
                        expect(err).to.have.property("code", "EINVAL");
                        expect(err).to.have.property("message", "Source and destination must not be the same.");
                        done();
                    });
                });
                test("should error if source and destination are the same and source does not exist", function (done) {
                    const src = getPath("async", "d2/t3/not-existent");
                    const dst = src;
                    move.move(src, dst, (err: TError) => {
                        expect(err).not.to.be.null;
                        expect(err).to.have.property("code", "ENOENT");
                        expect(err)
                            .to.have.property("message")
                            .to.match(/no such file or directory, .* '.*'/);
                        done();
                    });
                });
                test("should not move a directory if source and destination are the same", function (done) {
                    const src = getPath("async", "d2/t4");
                    const dst = src;
                    move.move(src, dst, (err: TError) => {
                        expect(err).to.exist;
                        expect(err).to.have.property("code", "EINVAL");
                        expect(err)
                            .to.have.property("message")
                            .to.match(/Source and destination must not be the same\./);
                        done();
                    });
                });
                test("should not overwrite the destination by default", function (done) {
                    const src = getPath("async", "d2/t5/f1");
                    const dst = getPath("async", "d2/t5/f1dst");
                    move.move(src, dst, (err: TError) => {
                        expect(err).to.not.be.null;
                        expect(err).to.have.property("code", "EEXIST");
                        expect(err)
                            .to.have.property("message")
                            .to.match(/.* item already exists\./);
                        done();
                    });
                });
                test("should create directory structure by default", function (done) {
                    const src = getPath("async", "d2/t6/f1");
                    const dst = getPath("async", "d2/t6/does/not/exist/file");
                    const original = fs.readFileSync(src);
                    move.move(src, dst, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst)).to.be.eql(original);
                        done();
                    });
                });
                test("should work across devices", function (done) {
                    const src = getPath("async", "d2/t7/f1");
                    const dst = getPath("async", "d2/t7/fileAnotherDevice");
                    const original = fs.readFileSync(src);
                    mockMove.move(src, dst, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst)).to.be.eql(original);
                        done();
                    });
                });
                test("should move folders", function (done) {
                    const src = getPath("async", "d2/t8");
                    const dst = getPath("async", "d2/t8dst");
                    const original = fs.readdirSync(src);
                    move.move(src, dst, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        done();
                    });
                });
                test("should move folders across devices with EXDEV error", function (done) {
                    const src = getPath("async", "d2/t9");
                    const dst = getPath("async", "d2/t9dst");
                    const original = fs.readdirSync(src);
                    mockMove.move(src, dst, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        done();
                    });
                });
                test("should move folders with stream", function (done) {
                    const src = getPath("async", "d2/t10");
                    const dst = getPath("async", "d2/t10dst");
                    const original = fs.readdirSync(src);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: move.MoveStreamOutType = JSON.parse(chunk);
                        if (obj.type.toLowerCase() === "file") {
                            files++;
                        } else {
                            dirs++;
                        }
                    });
                    move.move(src, dst, { stream: stream }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        expect(files).to.be.equal(0);
                        expect(dirs).to.be.equal(1);
                        done();
                    });
                });
                test("should move folders across devices with EXDEV error with stream", function (done) {
                    const src = getPath("async", "d2/t11");
                    const dst = getPath("async", "d2/t11dst");
                    const original = fs.readdirSync(src);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: move.MoveStreamOutType = JSON.parse(chunk);
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
                    mockMove.move(src, dst, { stream: stream }, (err: TError) => {
                        expect(err).to.be.null;
                        expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                        expect(files).to.be.equal(2);
                        expect(dirs).to.be.equal(2);
                        done();
                    });
                });
            });
            describe("> when merge = true", function () {
                describe("> when overwrite = true", function () {
                    test("should overwrite file", function (done) {
                        const src = getPath("async", "d3/d1/t1");
                        const dst = getPath("async", "d3/d1/t1dst");
                        expect(
                            fs.readFileSync(getPath("async", "d3/d1/t1dst/file"), { encoding: "utf-8" })
                        ).to.be.equal("content");
                        move.move(src, dst, { overwrite: true, merge: true }, (err: TError) => {
                            expect(err).to.be.null;
                            expect(
                                fs.readFileSync(getPath("async", "d3/d1/t1dst/file"), { encoding: "utf-8" })
                            ).to.be.equal("file");
                            done();
                        });
                    });
                });
                describe("> when overwrite = false (default) throw an error", function () {
                    test("should throw an error when dst exists", function (done) {
                        const src = getPath("async", "d3/d2/t1");
                        const dst = getPath("async", "d3/d2/t1dst");
                        move.move(src, dst, { merge: true }, (err: TError) => {
                            expect(err).to.not.be.null;
                            expect(err).to.have.property("code", "EEXIST");
                            expect(err)
                                .to.have.property("message")
                                .to.match(/.* item already exists\./);
                            done();
                        });
                    });
                    test("should merge directories", function (done) {
                        const src = getPath("async", "d3/d2/t2");
                        const dst = getPath("async", "d3/d2/t2dst");
                        const itemsSrc = fs.readdirSync(src).length;
                        const itemsDst = fs.readdirSync(dst).length;
                        move.move(src, dst, { overwrite: true, merge: true }, (err: TError) => {
                            expect(err).to.be.null;
                            const items = fs.readdirSync(dst);
                            expect(items.length).to.be.equal(itemsSrc + itemsDst);
                            expect(items).to.be.eql(["file1", "file2"]);
                            done();
                        });
                    });
                });
            });
        });
        describe("> promises", function () {
            describe("> when overwrite = true", function () {
                test("should overwrite file", async function () {
                    const src = getPath("promises", "d1/t1");
                    const dst = getPath("promises", "d1/t1dst");
                    expect(fs.existsSync(dst)).to.be.true;
                    await move.promises.move(src, dst, { overwrite: true });
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1");
                });
                test("should overwrite file with buffer path", async function () {
                    const src = Buffer.from(getPath("promises", "d1/t1b"));
                    const dst = getPath("promises", "d1/t1bdst");
                    expect(fs.existsSync(dst)).to.be.true;
                    await move.promises.move(src, dst, { overwrite: true });
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1b");
                });
                test("should overwrite the destination directory", async function () {
                    const src = getPath("promises", "d1/t2");
                    const dst = getPath("promises", "d1/t2dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    await move.promises.move(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite the destination directory with buffer path", async function () {
                    const src = Buffer.from(getPath("promises", "d1/t2b"));
                    const dst = getPath("promises", "d1/t2bdst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    await move.promises.move(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite folders across devices", async function () {
                    const src = getPath("promises", "d1/t3");
                    const dst = getPath("promises", "d1/t3dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    await mockMove.promises.move(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite the destination", async function () {
                    const src = getPath("promises", "d1/t4");
                    const dst = getPath("promises", "d1/t4dst");
                    const original = fs.readdirSync(src);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(["f2"]);
                    expect(original as unknown[]).to.be.eql(["f1"]);
                    await move.promises.move(src, dst, { overwrite: true });
                    const filesDst = fs.readdirSync(dst);
                    expect(filesDst as never[]).to.be.eql(original as never[]);
                    //dst should not have old stuff
                    expect(filesDst as unknown[]).not.to.be.eql(["f2"]);
                    //dst should have new stuff
                    expect(filesDst as unknown[]).to.be.eql(["f1"]);
                });
            });
            describe("> when overwrite = false (default)", function () {
                test("should rename a file on the same device", async function () {
                    const src = getPath("promises", "d2/t1/f1");
                    const dst = getPath("promises", "d2/t1/f1dst");
                    const original = fs.readFileSync(src);
                    await move.promises.move(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should not move a file if source and destination are the same", async function () {
                    const src = getPath("promises", "d2/t2/f1");
                    const dst = src;
                    const err: NodeJS.ErrnoException = await expect(move.promises.move(src, dst)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("EINVAL");
                    expect(err.message).to.be.equal("Source and destination must not be the same.");
                });
                test("should error if source and destination are the same and source does not exist", async function () {
                    const src = getPath("promises", "d2/t3/not-existent");
                    const dst = src;
                    const err: NodeJS.ErrnoException = await expect(move.promises.move(src, dst)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("ENOENT");
                    expect(err.message).to.be.match(/no such file or directory, .* '.*'/);
                });
                test("should not move a directory if source and destination are the same", async function () {
                    const src = getPath("promises", "d2/t4");
                    const dst = src;
                    const err: NodeJS.ErrnoException = await expect(move.promises.move(src, dst)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("EINVAL");
                    expect(err.message).to.match(/Source and destination must not be the same\./);
                });
                test("should not overwrite the destination by default", async function () {
                    const src = getPath("promises", "d2/t5/f1");
                    const dst = getPath("promises", "d2/t5/f1dst");
                    const err: NodeJS.ErrnoException = await expect(move.promises.move(src, dst)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("EEXIST");
                    expect(err.message).to.match(/.* item already exists\./);
                });
                test("should create directory structure by default", async function () {
                    const src = getPath("promises", "d2/t6/f1");
                    const dst = getPath("promises", "d2/t6/does/not/exist/file");
                    const original = fs.readFileSync(src);
                    await move.promises.move(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should work across devices", async function () {
                    const src = getPath("promises", "d2/t7/f1");
                    const dst = getPath("promises", "d2/t7/fileAnotherDevice");
                    const original = fs.readFileSync(src);
                    await mockMove.promises.move(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should move folders", async function () {
                    const src = getPath("promises", "d2/t8");
                    const dst = getPath("promises", "d2/t8dst");
                    const original = fs.readdirSync(src);
                    await move.promises.move(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error", async function () {
                    const src = getPath("promises", "d2/t9");
                    const dst = getPath("promises", "d2/t9dst");
                    const original = fs.readdirSync(src);
                    await mockMove.promises.move(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error with stream", async function () {
                    const src = getPath("promises", "d2/t11");
                    const dst = getPath("promises", "d2/t11dst");
                    const original = fs.readdirSync(src);
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    let files = 0,
                        dirs = 0;
                    stream.on("data", (chunk: string) => {
                        const obj: move.MoveStreamOutType = JSON.parse(chunk);
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
                    await mockMove.promises.move(src, dst, { stream: stream });
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                    expect(files).to.be.equal(2);
                    expect(dirs).to.be.equal(2);
                });
            });
            describe("> when merge = true", function () {
                describe("> when overwrite = true", function () {
                    test("should overwrite file", async function () {
                        const src = getPath("promises", "d3/d1/t1");
                        const dst = getPath("promises", "d3/d1/t1dst");
                        expect(
                            fs.readFileSync(getPath("promises", "d3/d1/t1dst/file"), { encoding: "utf-8" })
                        ).to.be.equal("content");
                        await expect(
                            move.promises.move(src, dst, {
                                overwrite: true,
                                merge: true,
                            })
                        ).to.not.be.eventually.rejected;
                        expect(
                            fs.readFileSync(getPath("promises", "d3/d1/t1dst/file"), { encoding: "utf-8" })
                        ).to.be.equal("file");
                    });
                });
                describe("> when overwrite = false (default) throw an error", function () {
                    test("should throw an error when dst exists", async function () {
                        const src = getPath("promises", "d3/d2/t1");
                        const dst = getPath("promises", "d3/d2/t1dst");
                        const err = await expect(move.promises.move(src, dst, { merge: true })).to.eventually.be
                            .rejected;
                        expect(err).to.have.property("code", "EEXIST");
                        expect(err)
                            .to.have.property("message")
                            .to.match(/.* item already exists\./);
                    });
                    test("should merge directories", async function () {
                        const src = getPath("promises", "d3/d2/t2");
                        const dst = getPath("promises", "d3/d2/t2dst");
                        const itemsSrc = fs.readdirSync(src).length;
                        const itemsDst = fs.readdirSync(dst).length;
                        await expect(
                            move.promises.move(src, dst, {
                                overwrite: true,
                                merge: true,
                            })
                        ).to.not.be.eventually.rejected;
                        const items = fs.readdirSync(dst);
                        expect(items.length).to.be.equal(itemsSrc + itemsDst);
                        expect(items).to.be.eql(["file1", "file2"]);
                    });
                });
            });
        });
        describe("> sync", function () {
            describe("> when overwrite = true", function () {
                test("should overwrite file", function () {
                    const src = getPath("sync", "d1/t1");
                    const dst = getPath("sync", "d1/t1dst");
                    expect(fs.existsSync(dst)).to.be.true;
                    move.moveSync(src, dst, { overwrite: true });
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1");
                });
                test("should overwrite file with buffer path", function () {
                    const src = Buffer.from(getPath("sync", "d1/t1b"));
                    const dst = getPath("sync", "d1/t1bdst");
                    expect(fs.existsSync(dst)).to.be.true;
                    move.moveSync(src, dst, { overwrite: true });
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("t1b");
                });
                test("should overwrite the destination directory", function () {
                    const src = getPath("sync", "d1/t2");
                    const dst = getPath("sync", "d1/t2dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    move.moveSync(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite the destination directory with buffer path", function () {
                    const src = Buffer.from(getPath("sync", "d1/t2b"));
                    const dst = getPath("sync", "d1/t2bdst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    move.moveSync(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite folders across devices", function () {
                    const src = getPath("sync", "d1/t3");
                    const dst = getPath("sync", "d1/t3dst");
                    expect(fs.existsSync(dst + "/f2")).to.be.true;
                    mockMove.moveSync(src, dst, { overwrite: true });
                    expect(fs.existsSync(src)).to.be.false;
                    expect(fs.existsSync(dst + "/f1")).to.be.true;
                });
                test("should overwrite the destination", function () {
                    const src = getPath("sync", "d1/t4");
                    const dst = getPath("sync", "d1/t4dst");
                    const original = fs.readdirSync(src);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(["f2"]);
                    expect(original as unknown[]).to.be.eql(["f1"]);
                    move.moveSync(src, dst, { overwrite: true });
                    const filesDst = fs.readdirSync(dst);
                    expect(filesDst as never[]).to.be.eql(original as never[]);
                    //dst should not have old stuff
                    expect(filesDst as unknown[]).not.to.be.eql(["f2"]);
                    //dst should have new stuff
                    expect(filesDst as unknown[]).to.be.eql(["f1"]);
                });
            });
            describe("> when overwrite = false (default)", function () {
                test("should rename a file on the same device", function () {
                    const src = getPath("sync", "d2/t1/f1");
                    const dst = getPath("sync", "d2/t1/f1dst");
                    const original = fs.readFileSync(src);
                    move.moveSync(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should not move a file if source and destination are the same", function () {
                    const src = getPath("sync", "d2/t2/f1");
                    const dst = src;
                    expect(() => move.moveSync(src, dst))
                        .to.throw()
                        .to.have.property("code", "EINVAL");
                });
                test("should error if source and destination are the same and source does not exist", function () {
                    const src = getPath("sync", "d2/t3/not-existent");
                    const dst = src;
                    expect(() => move.moveSync(src, dst))
                        .to.throw(/no such file or directory, .* '.*'/)
                        .to.have.property("code", "ENOENT");
                });
                test("should not move a directory if source and destination are the same", function () {
                    const src = getPath("sync", "d2/t4");
                    const dst = src;
                    expect(() => move.moveSync(src, dst))
                        .to.throw(/Source and destination must not be the same\./)
                        .to.have.property("code", "EINVAL");
                });
                test("should not overwrite the destination by default", function () {
                    const src = getPath("sync", "d2/t5/f1");
                    const dst = getPath("sync", "d2/t5/f1dst");
                    expect(() => move.moveSync(src, dst))
                        .to.throw(/.* item already exists\./)
                        .to.have.property("code", "EEXIST");
                });
                test("should create directory structure by default", function () {
                    const src = getPath("sync", "d2/t6/f1");
                    const dst = getPath("sync", "d2/t6/does/not/exist/file");
                    const original = fs.readFileSync(src);
                    move.moveSync(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should work across devices", function () {
                    const src = getPath("sync", "d2/t7/f1");
                    const dst = getPath("sync", "d2/t7/fileAnotherDevice");
                    const original = fs.readFileSync(src);
                    mockMove.moveSync(src, dst);
                    expect(fs.readFileSync(dst)).to.be.eql(original);
                });
                test("should move folders", function () {
                    const src = getPath("sync", "d2/t8");
                    const dst = getPath("sync", "d2/t8dst");
                    const original = fs.readdirSync(src);
                    move.moveSync(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
                test("should move folders across devices with EXDEV error", function () {
                    const src = getPath("sync", "d2/t9");
                    const dst = getPath("sync", "d2/t9dst");
                    const original = fs.readdirSync(src);
                    mockMove.moveSync(src, dst);
                    expect(fs.readdirSync(dst) as unknown[]).to.be.eql(original);
                });
            });
            describe("> when merge = true", function () {
                describe("> when overwrite = true", function () {
                    test("should overwrite file", function () {
                        const src = getPath("sync", "d3/d1/t1");
                        const dst = getPath("sync", "d3/d1/t1dst");
                        expect(fs.readFileSync(getPath("sync", "d3/d1/t1dst/file"), { encoding: "utf-8" })).to.be.equal(
                            "content"
                        );
                        expect(() =>
                            move.moveSync(src, dst, {
                                overwrite: true,
                                merge: true,
                            })
                        ).to.not.throw();
                        expect(fs.readFileSync(getPath("sync", "d3/d1/t1dst/file"), { encoding: "utf-8" })).to.be.equal(
                            "file"
                        );
                    });
                });
                describe("> when overwrite = false (default) throw an error", function () {
                    test("should throw an error when dst exists", function () {
                        const src = getPath("sync", "d3/d2/t1");
                        const dst = getPath("sync", "d3/d2/t1dst");
                        expect(() => move.moveSync(src, dst, { merge: true }))
                            .to.throw(/.* item already exists\./)
                            .to.have.property("code", "EEXIST");
                    });
                    test("should merge directories", function () {
                        const src = getPath("sync", "d3/d2/t2");
                        const dst = getPath("sync", "d3/d2/t2dst");
                        const itemsSrc = fs.readdirSync(src).length;
                        const itemsDst = fs.readdirSync(dst).length;
                        expect(() =>
                            move.moveSync(src, dst, {
                                overwrite: true,
                                merge: true,
                            })
                        ).to.not.throw();
                        const items = fs.readdirSync(dst);
                        expect(items.length).to.be.equal(itemsSrc + itemsDst);
                        expect(items).to.be.eql(["file1", "file2"]);
                    });
                });
            });
        });
    });
});
