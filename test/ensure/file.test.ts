import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as fs from "../../src/patch/patch";
import * as ensure from "../../src/ensure/index";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    async: {
        d1: {
            t1: {},
            t2: {},
            t3: {},
            t4: {
                f1: "f1",
            },
            t5: {
                f1: "f1",
            },
            t6: {},
        },
    },
    promises: {
        d1: {
            t1: {},
            t2: {},
            t3: {},
            t4: {
                f1: "f1",
            },
            t5: {
                f1: "f1",
            },
            t6: {},
        },
    },
    sync: {
        d1: {
            t1: {},
            t2: {},
            t3: {},
            t4: {
                f1: "f1",
            },
            t5: {
                f1: "f1",
            },
            t6: {},
        },
    },
};

const common = new Common("fs-extender-ensure-file", drive);
import { Type } from "@n3okill/utils";

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

describe("fs-extender", function () {
    describe("> ensure", function () {
        describe("> file", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            const _0777 = 0o777; //511
            const _0755 = 0o755; //493
            const _0744 = 0o744; //484
            const _0666 = 0o666;
            describe("> async", function () {
                test("should ensure file creation with content", function (done) {
                    const path = getPath("async", "d1/t1/file");
                    expect(fs.existsSync(path)).to.be.false;
                    const content = "file content";
                    ensure.ensureFile(
                        path,
                        { data: content, encoding: "utf-8" },
                        (err: NodeJS.ErrnoException | null, res?: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(fs.existsSync(path)).to.be.true;
                            expect(res).to.be.equal(path);
                            expect(fs.readFileSync(path, "utf-8")).to.be.equal(content);
                            done();
                        }
                    );
                });
                test("should test ensureFile with special characters", function (done) {
                    const data = "content also as sepcial chars: ›øΩ";
                    const path = getPath("async", "d1/t2/special_‰øᵹ_chars.src");
                    ensure.ensureFile(
                        path,
                        { data: data },
                        (err: NodeJS.ErrnoException | null, res?: fs.PathLike): void => {
                            expect(err).to.be.null;
                            expect(res).to.be.equal(path);
                            expect(fs.readFileSync(path, "utf-8")).to.be.equal(data);
                            done();
                        }
                    );
                });
                test("should test ensureFile and fail to create file when there's a dir", function (done) {
                    const path = getPath("async", "d1/t3");
                    expect(fs.existsSync(path)).to.be.true;
                    ensure.ensureFile(path, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.have.property("code", "EEXIST");
                        expect(err)
                            .to.have.property("message")
                            .to.match(/'.*' already exists and is not a file./);
                        done();
                    });
                });
                test("should not modify the file", function (done) {
                    const path = getPath("async", "d1/t4/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    ensure.ensureFile(path, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(path)).to.be.eql(original);
                        done();
                    });
                });
                test("should modify the file when there is data option and flag a+ true", function (done) {
                    const path = getPath("async", "d1/t5/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    ensure.ensureFile(
                        path,
                        { data: "new content", flag: "a+" },
                        (err: NodeJS.ErrnoException | null, res?: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(fs.readFileSync(path)).not.to.be.equal(original);
                            expect(fs.readFileSync(path, "utf-8")).to.be.equal(original + "new content");
                            expect(res).to.be.equal(path);
                            done();
                        }
                    );
                });
                test("should ensure new mode", function (done) {
                    const path = getPath("async", "d1/t6/file");
                    expect(fs.existsSync(path)).to.be.false;
                    ensure.ensureFile(path, { mode: _0744 }, (err: NodeJS.ErrnoException | null, res?: fs.PathLike) => {
                        expect(err).to.be.null;
                        expect(res).to.be.equal(path);
                        const stat = fs.statSync(path);
                        expect(stat.isFile()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                        ensure.ensureFile(
                            path,
                            { mode: _0755 },
                            (err2: NodeJS.ErrnoException | null, res2?: fs.PathLike) => {
                                expect(err2).to.be.null;
                                expect(res2).to.be.equal(path);
                                const stat2 = fs.statSync(path);
                                expect(stat2.isFile()).to.be.true;
                                expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                                expect(fs.readFileSync(path, "utf-8")).to.be.equal("");
                                done();
                            }
                        );
                    });
                });
            });
            describe("> promises", function () {
                test("should ensure file creation with content", async function () {
                    const path = getPath("promises", "d1/t1/file");
                    expect(fs.existsSync(path)).to.be.false;
                    const content = "file content";
                    const res = await ensure.promises.ensureFile(path, {
                        data: content,
                        encoding: "utf-8",
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    expect(res).to.be.equal(path);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(content);
                });
                test("should test ensureFile with special characters", async function () {
                    const data = "content also as sepcial chars: ›øΩ";
                    const path = getPath("promises", "d1/t2/special_‰øᵹ_chars.src");
                    const res = await ensure.promises.ensureFile(path, {
                        data: data,
                    });
                    expect(res).to.be.equal(path);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(data);
                });
                test("should test ensureFile and fail to create file when there's a dir", async function () {
                    const path = getPath("promises", "d1/t3");
                    expect(fs.existsSync(path)).to.be.true;
                    const err: NodeJS.ErrnoException = await expect(ensure.promises.ensureFile(path)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("EEXIST");
                    expect(err.message).to.match(/'.*' already exists and is not a file./);
                });
                test("should not modify the file", async function () {
                    const path = getPath("promises", "d1/t4/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    await ensure.promises.ensureFile(path);
                    expect(fs.readFileSync(path)).to.be.eql(original);
                });
                test("should modify the file when there is data option and flag a+", async function () {
                    const path = getPath("promises", "d1/t5/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    const res = await ensure.promises.ensureFile(path, {
                        data: "new content",
                        flag: "a+",
                    });
                    expect(fs.readFileSync(path)).not.to.be.equal(original);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(original + "new content");
                    expect(res).to.be.equal(path);
                });
                test("should ensure new mode", async function () {
                    const path = getPath("promises", "d1/t6/file");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = await ensure.promises.ensureFile(path, {
                        mode: _0744,
                    });
                    expect(res).to.be.equal(path);
                    const stat = fs.statSync(path);
                    expect(stat.isFile()).to.be.true;
                    expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    const res2 = await ensure.promises.ensureFile(path, {
                        mode: _0755,
                    });
                    expect(res2).to.be.equal(path);
                    const stat2 = fs.statSync(path);
                    expect(stat2.isFile()).to.be.true;
                    expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal("");
                });
            });
            describe("> sync", function () {
                test("should ensure file creation with content", function () {
                    const path = getPath("sync", "d1/t1/file");
                    expect(fs.existsSync(path)).to.be.false;
                    const content = "file content";
                    const res = ensure.ensureFileSync(path, {
                        data: content,
                        encoding: "utf-8",
                    });
                    expect(fs.existsSync(path)).to.be.true;
                    expect(res).to.be.equal(path);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(content);
                });
                test("should test ensureFile with special characters", function () {
                    const data = "content also as sepcial chars: ›øΩ";
                    const path = getPath("sync", "d1/t2/special_‰øᵹ_chars.src");
                    const res = ensure.ensureFileSync(path, { data: data });
                    expect(res).to.be.equal(path);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(data);
                });
                test("should test ensureFile and fail to create file when there's a dir", function () {
                    const path = getPath("sync", "d1/t3");
                    expect(fs.existsSync(path)).to.be.true;
                    expect(() => ensure.ensureFileSync(path))
                        .to.throw(/'.*' already exists and is not a file./)
                        .to.have.property("code", "EEXIST");
                });
                test("should not modify the file", function () {
                    const path = getPath("sync", "d1/t4/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    ensure.ensureFileSync(path);
                    expect(fs.readFileSync(path)).to.be.eql(original);
                });
                test("should modify the file when there is data option and flag a+", function () {
                    const path = getPath("sync", "d1/t5/f1");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path);
                    const res = ensure.ensureFileSync(path, {
                        data: "new content",
                        flag: "a+",
                    });
                    expect(fs.readFileSync(path)).not.to.be.equal(original);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal(original + "new content");
                    expect(res).to.be.equal(path);
                });
                test("should ensure new mode", function () {
                    const path = getPath("sync", "d1/t6/file");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = ensure.ensureFileSync(path, { mode: _0744 });
                    expect(res).to.be.equal(path);
                    const stat = fs.statSync(path);
                    expect(stat.isFile()).to.be.true;
                    expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    const res2 = ensure.ensureFileSync(path, { mode: _0755 });
                    expect(res2).to.be.equal(path);
                    const stat2 = fs.statSync(path);
                    expect(stat2.isFile()).to.be.true;
                    expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                    expect(fs.readFileSync(path, "utf-8")).to.be.equal("");
                });
            });
        });
    });
});
