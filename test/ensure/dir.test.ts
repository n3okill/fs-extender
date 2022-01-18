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
            t2: {
                f1: "f1",
                f2: "f2",
            },
            t3: {},
        },
    },
    promises: {
        d1: {
            t1: {},
            t2: {
                f1: "f1",
                f2: "f2",
            },
            t3: {},
        },
    },
    sync: {
        d1: {
            t1: {},
            t2: {
                f1: "f1",
                f2: "f2",
            },
            t3: {},
        },
    },
};

const common = new Common("fs-extender-ensure-dir", drive);
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
        describe("> dir", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            const _0777 = 0o777; //511
            const _0755 = 0o755; //493
            const _0744 = 0o744; //484
            const _0666 = 0o666; //438
            describe("> async", function () {
                test("should ensure dir creation", function (done) {
                    const path = getPath("async", "d1/t1/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    ensure.ensureDir(path, (err: NodeJS.ErrnoException | null, res: fs.PathLike) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.true;
                        expect(path).to.be.equal(res);
                        done();
                    });
                });
                test("should do nothing if dir exists", function (done) {
                    const path = getPath("async", "d1/t2");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path + "/f1");
                    ensure.ensureDir(path, (err: NodeJS.ErrnoException | null, res: fs.PathLike) => {
                        expect(err).to.be.null;
                        expect(fs.existsSync(path)).to.be.true;
                        expect(path).to.be.equal(res);
                        expect(fs.readFileSync(path + "/f1")).to.be.eql(original);
                        done();
                    });
                });
                test("should ensure mode change", function (done) {
                    this.timeout(5000);
                    const path = getPath("async", "d1/t3/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    ensure.ensureDir(path, { mode: _0744 }, (err: NodeJS.ErrnoException | null, res: fs.PathLike) => {
                        expect(err).to.be.null;
                        expect(res).to.be.equal(path);
                        const stat = fs.statSync(path);
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                        ensure.ensureDir(
                            path,
                            { mode: _0755 },
                            (err2: NodeJS.ErrnoException | null, res2: fs.PathLike) => {
                                expect(err2).to.be.null;
                                expect(res2).to.be.equal(path);
                                const stat2 = fs.statSync(path);
                                expect(stat2.isDirectory()).to.be.true;
                                expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                                done();
                            }
                        );
                    });
                });
            });
            describe("> promises", function () {
                test("should ensure dir creation", async function () {
                    const path = getPath("promises", "d1/t1/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = await ensure.promises.ensureDir(path);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(path).to.be.equal(res);
                });
                test("should do nothing if dir exists", async function () {
                    const path = getPath("promises", "d1/t2");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path + "/f1");
                    const res = await ensure.promises.ensureDir(path);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(path).to.be.equal(res);
                    expect(fs.readFileSync(path + "/f1")).to.be.eql(original);
                });
                test("should ensure mode change", async function () {
                    const path = getPath("promises", "d1/t3/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = await ensure.promises.ensureDir(path, {
                        mode: _0744,
                    });
                    expect(res).to.be.equal(path);
                    const stat = fs.statSync(path);
                    expect(stat.isDirectory()).to.be.true;
                    expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    const res2 = await ensure.promises.ensureDir(path, {
                        mode: _0755,
                    });
                    expect(res2).to.be.equal(path);
                    const stat2 = fs.statSync(path);
                    expect(stat2.isDirectory()).to.be.true;
                    expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                });
            });
            describe("> sync", function () {
                test("should ensure dir creation", function () {
                    const path = getPath("sync", "d1/t1/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = ensure.ensureDirSync(path);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(path).to.be.equal(res);
                });
                test("should do nothing if dir exists", function () {
                    const path = getPath("sync", "d1/t2");
                    expect(fs.existsSync(path)).to.be.true;
                    const original = fs.readFileSync(path + "/f1");
                    const res = ensure.ensureDirSync(path);
                    expect(fs.existsSync(path)).to.be.true;
                    expect(path).to.be.equal(res);
                    expect(fs.readFileSync(path + "/f1")).to.be.eql(original);
                });
                test("should ensure mode change", function () {
                    const path = getPath("sync", "d1/t3/folder");
                    expect(fs.existsSync(path)).to.be.false;
                    const res = ensure.ensureDirSync(path, { mode: _0744 });
                    expect(res).to.be.equal(path);
                    const stat = fs.statSync(path);
                    expect(stat.isDirectory()).to.be.true;
                    expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                    const res2 = ensure.ensureDirSync(path, { mode: _0755 });
                    expect(res2).to.be.equal(path);
                    const stat2 = fs.statSync(path);
                    expect(stat2.isDirectory()).to.be.true;
                    expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                });
            });
        });
    });
});
