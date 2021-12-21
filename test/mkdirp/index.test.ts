import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import { Type, StringUtil } from "@n3okill/utils";
import * as mkdirp from "../../src/mkdirp";
import * as fs from "../../src/patch/patch";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    async: {},
    promises: {},
    sync: {},
};

const common = new Common("fs-extender-mkdirp", drive);
import NodePath from "path-extender";
import * as NodeFs from "fs";

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

function getPathRelative(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPathRelative([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPathRelative(arg);
}

describe("fs-extender", function () {
    describe("> mkdirp", function () {
        const cwd = process.cwd();
        before(async function () {
            await common.beforeAll();
            process.chdir(common.getPath(""));
        });
        after(async function () {
            process.chdir(cwd);
            return common.afterAll();
        });
        const invalidWindowsDrive = "AB:\\";
        const _0777 = 0o777; //parseInt("0777", 8); 511
        const _0755 = 0o755; //parseInt("0755", 8); 493
        const _0744 = 0o744; //parseInt("0744", 8); 484
        const _0666 = 0o666; //parseInt("0666", 8); 438

        describe("> async", function () {
            test("should test mkdirp", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("async", [x, y, z]);
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test mkdirp with buffer path", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = Buffer.from(getPath("async", [x, y, z]));
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test chmod", function (done) {
                const ps = [];
                for (let i = 0; i < 2; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("async", ps);
                mkdirp.mkdirp(file, { mode: _0744 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                        mkdirp.mkdirp(file, { mode: _0755 }, (err2: NodeJS.ErrnoException | null): void => {
                            expect(err2).to.be.null;
                            fs.stat(file, (errStat2: NodeJS.ErrnoException | null, stat2: NodeFs.Stats): void => {
                                expect(errStat2).to.be.null;
                                expect(stat2.isDirectory()).to.be.true;
                                expect(stat2.mode & _0777).not.to.be.equal(_0755);
                                expect(stat2.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                                done();
                            });
                        });
                    });
                });
            });
            test("should test overwrite", function (done) {
                const ps = [];
                for (let i = 0; i < 2; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("async", ps);
                //a file in the way
                const itw = getPath("async", ps.slice(0, 1));
                fs.writeFile(itw, "I am in the way", (errWrite: NodeJS.ErrnoException | null): void => {
                    expect(errWrite).to.be.null;
                    fs.stat(itw, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isFile()).to.be.true;
                        mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                            expect(err).not.to.be.null;
                            //using mkdir(2) will throw an EEXIST even if there's a file in the way instead of throwing ENOTDIR
                            expect((err as NodeJS.ErrnoException).code).to.match(/ENOTDIR|EEXIST/);
                            done();
                        });
                    });
                });
            });
            test("should test permissions", function (done) {
                const file = getPath("async", (Math.random() * (1 << 30)).toString(16));
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test race", function (done) {
                const testsNumber = 10;
                let counter = testsNumber;
                const ps = [];

                for (let i = 0; i < 25; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("async", ps);
                function makeFile(file: string): void {
                    mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                        expect(err).to.be.null;
                        const stat = fs.statSync(file);
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        if (--counter === 0) {
                            done();
                        }
                    });
                }

                for (let i = 0; i < testsNumber; i++) {
                    makeFile(file);
                }
            });
            test("should test relative path", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPathRelative("async", [x, y, z]);
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test relative path 2", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = ["async", x, "..", x, y, z].join(NodePath.sep);
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test relative path 3", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = [".", "async", x, y, z].join(NodePath.sep);
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                        done();
                    });
                });
            });
            test("should test return value", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPathRelative("async", [x, y, z]);
                const f = NodePath.resolve(file);
                // should always return the full path created.
                //on second test it won't recreate the folder but will return the path
                mkdirp.mkdirp(
                    file,
                    (
                        err: NodeJS.ErrnoException | null,
                        made: NodeFs.PathLike | NodeFs.PathLike[] | undefined
                    ): void => {
                        expect(err).to.be.null;
                        expect(made).to.be.equal(f);
                        mkdirp.mkdirp(
                            file,
                            (
                                err2: NodeJS.ErrnoException | null,
                                made2: NodeFs.PathLike | NodeFs.PathLike[] | undefined
                            ): void => {
                                expect(err2).to.be.null;
                                expect(made2).to.be.equal(f);
                                done();
                            }
                        );
                    }
                );
            });
            test("should test root", function (done) {
                const file = NodePath.parse(process.cwd()).root; // "/";
                // '/' on unix, 'c:/' on windows.
                process.chdir(file);
                mkdirp.mkdirp(file, { mode: _0755 }, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.match(/EPERM/);
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        process.chdir(common.getPath(""));
                        done();
                    });
                });
            });
            test("should test implicit mode from umask", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = common.getPath(["async", x, y, z]);
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat.isDirectory()).to.be.true;
                        expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
                        done();
                    });
                });
            });
            test("should test null byte filename", function (done) {
                const nullChar = "\0";
                let doneCalled = false;

                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = getPath("async", [x, y, z, nullChar]);

                function checkError(err: unknown): void {
                    expect(err).not.to.be.null;
                    expect((err as NodeJS.ErrnoException).code).to.match(
                        /ENOENT|ERR_INVALID_ARG_TYPE|ERR_INVALID_ARG_VALUE/
                    );
                    expect((err as NodeJS.ErrnoException).message).to.match(
                        /string( or Uint8Array)? without null bytes/
                    );
                    if (!doneCalled) {
                        doneCalled = true;
                        done();
                    }
                }

                try {
                    //this must be try catch because of update in newer node versions which throws the error
                    // instead of sending it back to callback.
                    // the error is the same in both cases
                    mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                        checkError(err);
                    });
                } catch (err2) {
                    checkError(err2);
                }
            });
            test("should test curly braces async", function (done) {
                const file = `${getPath("async", "")}/{production,dev}/{css,img,js}`;
                const paths = StringUtil.expand(file).map((path: string): string => {
                    return NodePath.resolve(path);
                });
                let size = paths.length;
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    paths.forEach((path: string): void => {
                        fs.stat(path, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                            expect(errStat).to.be.null;
                            expect(stat.isDirectory()).to.be.true;
                            if (--size === 0) {
                                done();
                            }
                        });
                    });
                });
            });
            test("should test invalid path drive on windows", function (done) {
                const file = getPath("async", `${invalidWindowsDrive}fooAsync`);
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    if (common.IsWindows) {
                        expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                    } else {
                        expect(err).to.be.null;
                    }
                    done();
                });
            });
            test("should test invalid filename with double quote async", function (done) {
                const file = getPath("async", `foo"bar`);
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    if (common.IsWindows) {
                        expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                    } else {
                        expect(err).to.be.null;
                    }
                    done();
                });
            });
            test("should test valid filename with line-break", function (done) {
                const file = getPath("async", `lineBreak\n`);
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    if (common.IsWindows) {
                        expect(err).to.not.be.null;
                    } else {
                        expect(err).to.be.null;
                    }
                    done();
                });
            });
            test("should test Date.toISOString", function (done) {
                const file = getPath("async", [new Date().toISOString(), "test"]);
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    if (common.IsWindows) {
                        expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                        return done();
                    }
                    expect(err).to.be.null;
                    fs.stat(file, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                        expect(errStat).to.be.null;
                        expect(stat).to.have.property("ctime");
                        expect(stat.isDirectory()).to.be.true;
                        done();
                    });
                });
            });
            test("should test mkdir with array of paths", function (done) {
                const file = [getPath("async", "abc"), getPath("async", "xyz")];

                let size = file.length;
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    file.forEach(function (path): void {
                        fs.stat(path, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                            expect(errStat).to.be.null;
                            expect(stat.isDirectory()).to.be.true;
                            if (--size === 0) {
                                done();
                            }
                        });
                    });
                });
            });
            test("should test mkdir with array of paths and curly braces", function (done) {
                let paths: string[] = [];
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = [
                    `${getPath("async", x)}/{production,dev}/{css,img,js}`,
                    `${getPath("async", y)}/{production,dev}/{css,img,js}`,
                ];
                file.forEach(function (p): void {
                    paths = paths.concat(StringUtil.expand(p));
                });
                let size = file.length;
                mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                    expect(err).to.be.null;
                    paths.forEach((path: string): void => {
                        fs.stat(path, (errStat: NodeJS.ErrnoException | null, stat: NodeFs.Stats): void => {
                            expect(errStat).to.be.null;
                            expect(stat.isDirectory()).to.be.true;
                            if (--size === 0) {
                                done();
                            }
                        });
                    });
                });
            });
            test("should test mkdir with a file of the same name", function (done) {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("async", [x, "file.json"]);
                mkdirp.mkdirp(
                    getPathRelative("async", x.toString()),
                    (errMkdir: NodeJS.ErrnoException | null): void => {
                        expect(errMkdir).to.be.null;
                        fs.writeFile(file, "Data inside file", (errWrite: NodeJS.ErrnoException | null): void => {
                            expect(errWrite).to.be.null;
                            mkdirp.mkdirp(file, (err: NodeJS.ErrnoException | null): void => {
                                expect(err).not.to.be.null;
                                expect((err as NodeJS.ErrnoException).code).to.be.match(/ENOTDIR|EEXIST|ENOENT/);
                                done();
                            });
                        });
                    }
                );
            });
        });
        describe("> promise", function () {
            test("should test mkdirp", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("promises", [x, y, z]);
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test mkdirp with buffer path", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = Buffer.from(getPath("promises", [x, y, z]));
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test chmod", async function () {
                const ps = [];
                for (let i = 0; i < 25; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("promises", ps);
                await mkdirp.promises.mkdirp(file, { mode: _0744 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats2 = await fs.promises.stat(file);
                expect(stats2.isDirectory()).to.be.true;
                expect((stats2.mode as number) & _0777).not.to.be.equal(_0755);
                expect((stats2.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
            });
            test("should test overwrite", async function () {
                const ps = [];
                for (let i = 0; i < 2; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("promises", ps);
                //a file in the way
                const itw = getPath("promises", ps.slice(0, 1));
                await fs.promises.writeFile(itw, "I am in the way");
                const stats = await fs.promises.stat(itw);
                expect(stats.isFile()).to.be.true;
                //using mkdir(2) will throw an EEXIST even if there's a file in the way instead of throwing ENOTDIR
                expect(mkdirp.promises.mkdirp(file, { mode: _0755 })).to.eventually.rejectedWith(
                    /ENOTDIR|EEXIST|ENOENT/
                );
            });
            test("should test permissions", async function () {
                const file = getPath("promises", (Math.random() * (1 << 30)).toString(16));
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test race", async function () {
                const testsNumber = 10;
                const ps = [],
                    promises = [];

                for (let i = 0; i < 25; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("promises", ps);

                async function makeFile(file: string) {
                    await mkdirp.promises.mkdirp(file, { mode: _0755 });
                    const stats = await fs.promises.stat(file);
                    expect(stats.isDirectory()).to.be.true;
                    expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                }

                for (let i = 0; i < testsNumber; i++) {
                    promises.push(makeFile(file));
                }
                return Promise.all(promises);
            });
            test("should test relative path", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = getPathRelative("promises", [x, y, z]);
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test relative path 2", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = ["promises", x, "..", x, y, z].join(NodePath.sep);
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test relative path 3", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = [".", "promises", x, y, z].join(NodePath.sep);
                await mkdirp.promises.mkdirp(file, { mode: _0755 });
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test return value", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPathRelative("promises", [x, y, z]);
                const f = NodePath.resolve(file);
                // should always return the full path created.
                //on second test it won't recreate the folder but will return the path
                const made = await mkdirp.promises.mkdirp(file);
                expect(made).to.be.equal(f);
                const made2 = await mkdirp.promises.mkdirp(file);
                expect(made2).to.be.equal(f);
            });
            test("should test root", async function () {
                const file = NodePath.parse(process.cwd()).root; //NodePath.resolve(NodePath.sep);
                // '/' on unix, 'c:/' on windows.
                try {
                    process.chdir(file);
                    await mkdirp.promises.mkdirp(file, { mode: _0755 });
                } catch (err) {
                    expect((err as NodeJS.ErrnoException).code).to.match(/EPERM/);
                } finally {
                    process.chdir(common.getPath(""));
                }
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
            });
            test("should test implicit mode from umask", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = getPath("promises", [x, y, z]);

                await mkdirp.promises.mkdirp(file);
                const stats = await fs.promises.stat(file);
                expect(stats.isDirectory()).to.be.true;
                expect((stats.mode as number) & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
            });
            test("should test null byte filename", async function () {
                const nullChar = "\0";
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("promises", [x, y, z, nullChar]);
                const err = await expect(mkdirp.promises.mkdirp(file)).to.eventually.rejectedWith(
                    /string( or Uint8Array)? without null bytes/
                );
                expect((err as NodeJS.ErrnoException).code).to.match(
                    /ENOENT|ERR_INVALID_ARG_TYPE|ERR_INVALID_ARG_VALUE/
                );
            });
            test("should test curly braces async", async function () {
                const file = `${getPath("promises", "")}/{production,dev}/{css,img,js}`;
                const paths = StringUtil.expand(file).map((path: string): string => {
                    return NodePath.resolve(path);
                });
                await mkdirp.promises.mkdirp(file);
                const ps: Promise<unknown>[] = [];
                paths.forEach((path: string): void => {
                    ps.push(fs.promises.stat(path).then((stat) => expect(stat.isDirectory()).to.be.true));
                });
                await Promise.all(ps);
                expect(ps).to.have.length(paths.length);
            });
            test("should test invalid path drive on windows", async () => {
                expect(mkdirp.promises.mkdirp(getPath("promises", `${invalidWindowsDrive}fooAsync`))).not.to.eventually
                    .rejected;
            });
            test("should test invalid filename with double quote async", async function () {
                expect(mkdirp.promises.mkdirp(getPath("promises", `foo"bar`))).not.to.eventually.rejected;
            });
            test("should test valid filename with line-break", async () => {
                const file = getPath("promises", `lineBreak\n`);
                expect(mkdirp.promises.mkdirp(file)).not.to.eventually.rejected;
                /*expect(mkdirp.promises.mkdirp(file)).rejects.to.matchObject({
                    code: "ENOENT",
                    message: expect.stringMatching(/no such file or directory, mkdir/)
                });*/
            });
            test("should test Date.toISOString", async () => {
                const file = getPathRelative("promises", [new Date().toISOString(), "test"]);
                const f = NodePath.resolve(file);
                try {
                    const result = await mkdirp.promises.mkdirp(file);
                    expect(result).to.be.equal(f);
                    const stat = await fs.promises.stat(file);
                    expect(stat).to.have.property("ctime");
                    expect(stat.isDirectory()).to.be.true;
                } catch (err) {
                    expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                }
            });
            test("should test mkdirp with array of paths", async function () {
                const file = [getPath("promises", "abc"), getPath("promises", "xyz")];
                await mkdirp.promises.mkdirp(file);
                const ps: Promise<unknown>[] = [];
                file.forEach(function (path): void {
                    ps.push(fs.promises.stat(path).then((stat) => expect(stat.isDirectory()).to.be.true));
                });
                await Promise.all(ps);
                expect(ps).to.have.length(file.length);
            });
            test("should test mkdirp with array of paths and curly braces", async () => {
                let paths: string[] = [];
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = [
                    `${getPath("promises", x)}/{production,dev}/{css,img,js}`,
                    `${getPath("promises", y)}/{production,dev}/{css,img,js}`,
                ];
                file.forEach(function (p): void {
                    paths = paths.concat(StringUtil.expand(p));
                });
                await mkdirp.promises.mkdirp(file);
                const ps: Promise<unknown>[] = [];
                paths.forEach((path: string): void => {
                    ps.push(fs.promises.stat(path).then((stat) => expect(stat.isDirectory()).to.be.true));
                });
                await Promise.all(ps);
                expect(ps).to.have.length(paths.length);
            });
            test("should test mkdir with a file of the same name", async function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("promises", [x, "file.json"]);
                await mkdirp.promises.mkdirp(getPath("promises", x));
                await fs.promises.writeFile(file, "Data inside file");
                expect(mkdirp.promises.mkdirp(file)).to.eventually.rejectedWith(/ENOTDIR|EEXIST/);
            });
        });
        describe("> sync", function () {
            test("should test mkdirp", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("sync", [x, y, z]);
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test mkdirp with buffer path", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = Buffer.from(getPath("sync", [x, y, z]));
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test chmod", function () {
                const ps = [];
                for (let i = 0; i < 25; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("sync", ps);
                mkdirp.mkdirpSync(file, { mode: _0744 });
                let stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
                mkdirp.mkdirpSync(file, { mode: _0755 });
                stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).not.to.be.equal(_0755);
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0744);
            });
            test("should test overwrite", function () {
                const ps = [];
                for (let i = 0; i < 2; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("sync", ps);
                //a file in the way
                const itw = getPath("sync", ps.slice(0, 1));
                fs.writeFileSync(itw, "I am in the way");
                const stats = fs.statSync(itw);
                expect(stats.isFile()).to.be.true;
                try {
                    mkdirp.mkdirpSync(file, { mode: _0755 });
                } catch (err) {
                    //using mkdir(2) will throw an EEXIST even if there's a file in the way instead of throwing ENOTDIR
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOTDIR|EEXIST/);
                }
            });
            test("should test permissions", function () {
                const file = getPath("sync", (Math.random() * (1 << 30)).toString(16));
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stats = fs.statSync(file);
                expect(stats.isDirectory()).to.be.true;
                expect(stats.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test race", function () {
                const testsNumber = 10;
                const ps = [];

                for (let i = 0; i < 25; i++) {
                    ps.push(Math.floor(Math.random() * Math.pow(16, 4)).toString(16));
                }
                const file = getPath("sync", ps);

                for (let i = 0; i < testsNumber; i++) {
                    mkdirp.mkdirpSync(file, { mode: _0755 });
                    const stats = fs.statSync(file);
                    expect(stats.isDirectory()).to.be.true;
                    expect(stats.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
                }
            });
            test("should test relative path", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPathRelative("sync", [x, y, z]);
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test relative path 2", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = ["sync", x, "..", x, y, z].join(NodePath.sep);
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test relative path 3", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = ["sync", ".", x, y, z].join(NodePath.sep);
                mkdirp.mkdirpSync(file, { mode: _0755 });
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0755);
            });
            test("should test return value", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPathRelative("sync", [x, y, z]);
                const f = NodePath.resolve(file);
                // should always return the full path created.
                //on second test it won't recreate the folder but will return the path
                expect(mkdirp.mkdirpSync(file)).to.be.equal(f);
                expect(mkdirp.mkdirpSync(file)).to.be.equal(f);
            });
            test("should test root", function () {
                const file = NodePath.parse(process.cwd()).root;
                // '/' on unix, 'c:/' on windows.
                try {
                    process.chdir(file);
                    mkdirp.mkdirpSync(file, { mode: _0755 });
                    expect(fs.statSync(file).isDirectory()).to.be.true;
                } catch (err) {
                    expect(err).to.have.property("code").to.match(/EPERM/);
                } finally {
                    process.chdir(common.getPath(""));
                }
            });
            test("should test implicit mode from umask", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("sync", [x, y, z]);

                mkdirp.mkdirpSync(file);
                const stat = fs.statSync(file);
                expect(stat.isDirectory()).to.be.true;
                expect(stat.mode & _0777).to.be.equal(common.IsWindows ? _0666 : _0777);
            });
            test("should test null byte filename", function () {
                const nullChar = "\0";
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("sync", [x, y, z, nullChar]);
                try {
                    mkdirp.mkdirpSync(file);
                } catch (err) {
                    expect((err as NodeJS.ErrnoException).code).to.match(
                        /ENOENT|ERR_INVALID_ARG_TYPE|ERR_INVALID_ARG_VALUE/
                    );
                    expect((err as NodeJS.ErrnoException).message).to.match(
                        /string( or Uint8Array)? without null bytes/
                    );
                }
            });
            test("should test curly braces async", function () {
                const file = `${getPathRelative("sync", "")}/{production,dev}/{css,img,js}`;
                const paths = StringUtil.expand(file).map((path: string): string => {
                    return NodePath.resolve(path);
                });
                mkdirp.mkdirpSync(file);
                let count = 0;
                paths.forEach((path: string): void => {
                    count++;
                    expect(fs.statSync(path).isDirectory()).to.be.true;
                });
                expect(count).to.be.equal(paths.length);
            });
            test("should test invalid path drive on windows", function () {
                if (common.IsWindows) {
                    expect(() => mkdirp.mkdirpSync(getPath("sync", `${invalidWindowsDrive}fooAsync`))).to.throw();
                } else {
                    expect(() => mkdirp.mkdirpSync(getPath("sync", `${invalidWindowsDrive}fooAsync`))).to.not.throw();
                }
            });
            test("should test invalid filename with double quote async", function () {
                if (common.IsWindows) {
                    expect(() => mkdirp.mkdirpSync(getPath("sync", `foo"bar`))).to.throw();
                } else {
                    expect(() => mkdirp.mkdirpSync(getPath("sync", `foo"bar`))).to.not.throw();
                }
            });
            test("should test valid filename with line-break", function () {
                const file = getPath("sync", `lineBreak\n`);
                if (common.IsWindows) {
                    expect(() => mkdirp.mkdirpSync(file)).to.throw();
                } else {
                    expect(() => mkdirp.mkdirpSync(file)).to.not.throw();
                }
            });
            test("should test Date.toISOString", function () {
                const file = getPath("sync", [new Date().toISOString(), "test"]);
                const f = NodePath.resolve(file);
                try {
                    const result = mkdirp.mkdirpSync(file);
                    expect(result).to.be.equal(f);
                    const stat = fs.statSync(file);
                    expect(stat).to.have.property("ctime");
                    expect(stat.isDirectory()).to.be.true;
                } catch (err) {
                    expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                }
            });
            test("should test mkdirp with array of paths", function () {
                const file = [getPath("sync", "abc"), getPath("sync", "xyz")];
                let count = 0;
                mkdirp.mkdirpSync(file);
                file.forEach((path): void => {
                    count++;
                    expect(fs.statSync(path).isDirectory()).to.be.true;
                });
                expect(count).to.be.equal(file.length);
            });
            test("should test mkdirp with array of paths and curly braces", function () {
                let paths: string[] = [];
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

                const file = [
                    `${getPath("sync", x)}/{production,dev}/{css,img,js}`,
                    `${getPath("sync", y)}/{production,dev}/{css,img,js}`,
                ];
                file.forEach(function (p): void {
                    paths = paths.concat(StringUtil.expand(p));
                });
                mkdirp.mkdirpSync(file);
                paths.forEach((path: string): void => {
                    expect(fs.statSync(path).isDirectory()).to.be.true;
                });
            });
            test("should test mkdir with a file of the same name", function () {
                const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                const file = getPath("sync", [x, "file.json"]);
                fs.mkdirSync(NodePath.dirname(file));
                fs.writeFileSync(file, "Data inside file");
                expect(() => mkdirp.mkdirpSync(file)).to.throw(/ENOTDIR|EEXIST/);
            });
        });
    });
});
