import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
import { Type } from "@n3okill/utils";
import NodePath from "path-extender";
use(chaiAsPromised);

//import * as NodeFs from "fs";
import * as fs from "../../src/patch/patch.js";
import * as ensure from "../../src/ensure/index.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    async: {
        symlink: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
        ensure: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
    },
    promises: {
        symlink: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
        ensure: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
    },
    sync: {
        symlink: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
        ensure: {
            "foo.txt": "foo",
            "empty-dir": {},
            "dir-foo": { "foo.txt": "dir-foo" },
            "dir-bar": { "bar.txt": "dir-bar" },
            "real-alpha": { "real-beta": { "real-gamma": {} } },
        },
    },
};

const common = new Common("fs-extender-ensure-link", drive);

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

describe("fs-extender", function () {
    describe("> ensure", function () {
        (common.canSymlinkTest ? describe : describe.skip)("> symlink", function () {
            const cwd = process.cwd();
            before(async function () {
                await common.beforeAll();
                process.chdir(common.getPath(""));
            });
            after(async function () {
                process.chdir(cwd);
                return common.afterAll();
            });
            const tests = [
                {
                    src: "./foo.txt",
                    dst: "./symlink.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "../foo.txt",
                    dst: "./empty-dir/symlink.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./dir-foo/symlink.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./empty-dir/symlink.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/symlink.txt",
                    fs: "file-broken",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/real-beta/symlink.txt",
                    fs: "file-broken",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/real-beta/real-gamma/symlink.txt",
                    fs: "file-broken",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/symlink.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/beta/symlink.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/beta/gamma/symlink.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-symlink.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./dir-foo/foo.txt",
                    dst: "./real-symlink.txt",
                    fs: "file-error",
                    ensure: "file-dst-exists",
                },
                {
                    src: "./missing.txt",
                    dst: "./symlink-missing.txt",
                    fs: "file-broken",
                    ensure: "file-error",
                },
                {
                    src: "./missing.txt",
                    dst: "./missing-dir/symlink.txt",
                    fs: "file-error",
                    ensure: "file-error",
                },
                // error is thrown if destination path exists
                {
                    src: "./foo.txt",
                    dst: "./dir-foo/foo.txt",
                    fs: "file-error",
                    ensure: "file-dst-exists",
                },
                {
                    src: "./dir-foo",
                    dst: "./symlink-dir-foo",
                    fs: "dir-success",
                    ensure: "dir-success",
                },
                {
                    src: "../dir-bar",
                    dst: "./dir-foo/symlink-dir-bar",
                    fs: "dir-success",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./dir-foo/symlink-dir-bar",
                    fs: "dir-error",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./empty-dir/symlink-dir-bar",
                    fs: "dir-broken",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./real-alpha/symlink-dir-bar",
                    fs: "dir-broken",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./real-alpha/real-beta/symlink-dir-bar",
                    fs: "dir-broken",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./real-alpha/real-beta/real-gamma/symlink-dir-bar",
                    fs: "dir-broken",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-foo",
                    dst: "./alpha/dir-foo",
                    fs: "dir-error",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-foo",
                    dst: "./alpha/beta/dir-foo",
                    fs: "dir-error",
                    ensure: "dir-success",
                },
                {
                    src: "./missing",
                    dst: "./dir-foo/symlink-dir-missing",
                    fs: "dir-broken",
                    ensure: "dir-error",
                },
                {
                    src: "./dir-foo",
                    dst: "./real-alpha/real-beta",
                    fs: "dir-error",
                    ensure: "dir-dst-exists",
                },
                {
                    src: "./dir-foo",
                    dst: "./real-symlink-dir-foo",
                    fs: "dir-error",
                    ensure: "dir-success",
                },
                {
                    src: "./dir-bar",
                    dst: "./real-symlink-dir-foo",
                    fs: "dir-error",
                    ensure: "dir-dst-exists",
                },
            ];
            describe("> async", function () {
                [
                    {
                        name: "> fs.symlink",
                        path: "async/symlink",
                        fn: fs.symlink,
                    },
                    {
                        name: "> ensureSymLink",
                        path: "async/ensure",
                        fn: ensure.ensureSymlink,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        before(() => {
                            process.chdir(getPath(d.path, ""));
                            fs.symlinkSync("foo.txt", "real-symlink.txt");
                            fs.symlinkSync("dir-foo", "real-symlink-dir-foo");
                        });
                        tests.forEach((t) => {
                            const src = t.src;
                            const dst = t.dst;
                            switch (d.name === "> fs.symlink" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create a symlink file using '${t.src}' and dst '${t.dst}'`, function (done) {
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err).to.be.null;
                                            const relative = ensure.symlinkPathsSync(src, dst);
                                            expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                            const c1 = fs.readFileSync(relative.toCwd, "utf-8");
                                            const c2 = fs.readFileSync(dst, "utf-8");
                                            expect(c1).to.be.equal(c2);
                                            const dstDirContent = fs.readdirSync(NodePath.dirname(dst)) as string[];
                                            expect(dstDirContent.indexOf(NodePath.basename(dst))).to.be.at.least(0);
                                            done();
                                        });
                                    });
                                    break;
                                case "file-broken":
                                    test(`should create broken symlink file using src '${t.src}' and dst '${t.dst}'`, function (done) {
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err).to.be.null;
                                            expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                            expect(
                                                (fs.readdirSync(NodePath.dirname(dst)) as string[]).indexOf(
                                                    NodePath.basename(dst)
                                                )
                                            ).to.be.at.least(0);
                                            expect(() => fs.readFileSync(dst, "utf-8"))
                                                .to.throw()
                                                .to.have.property("code", "ENOENT");
                                            done();
                                        });
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, function (done) {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err)
                                                .to.have.property("code")
                                                .to.match(/ENOENT|EEXIST/);
                                            let statAfter: fs.Stats | undefined;
                                            try {
                                                statAfter = fs.statSync(NodePath.dirname(dst));
                                            } catch (err) {}
                                            expect(statAfter).to.eql(statBefore);
                                            done();
                                        });
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function (done) {
                                        const contentBefore = fs.readFileSync(dst, "utf8");
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err).to.be.null;
                                            const contentAfter = fs.readFileSync(dst, "utf8");
                                            expect(contentBefore).to.be.equal(contentAfter);
                                            done();
                                        });
                                    });
                                    break;
                                case "dir-success":
                                    test(
                                        "should create symlink dir using src '" + t.src + "' and dst '" + t.dst + "'",
                                        function (done) {
                                            d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                                expect(err).to.be.null;
                                                const relative = ensure.symlinkPathsSync(src, dst);
                                                expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                                //this try catch is for passing at git actions
                                                //try {
                                                expect(fs.readdirSync(relative.toCwd)).to.be.eql(fs.readdirSync(dst));
                                                expect(
                                                    fs
                                                        .readdirSync(NodePath.dirname(dst))
                                                        .indexOf(NodePath.basename(dst))
                                                ).to.be.at.least(0);
                                                //} catch (err) {}
                                                done();
                                            });
                                        }
                                    );
                                    break;
                                case "dir-broken":
                                    test(
                                        "should create broken symlink dir using src '" +
                                            t.src +
                                            "' and dst '" +
                                            t.dst +
                                            "'",
                                        function (done) {
                                            d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                                expect(err).to.be.null;
                                                const stat = fs.lstatSync(dst);
                                                const contents = fs.readdirSync(NodePath.dirname(dst));
                                                expect(stat.isSymbolicLink()).to.be.true;
                                                expect(
                                                    (contents as string[]).indexOf(NodePath.basename(dst))
                                                ).to.be.at.least(0);
                                                expect(() => fs.readdirSync(dst))
                                                    .to.throw()
                                                    .to.have.property("code", "ENOENT");
                                                done();
                                            });
                                        }
                                    );
                                    break;
                                case "dir-error":
                                    test(`should return error when creating symlink dir using src '${t.src}' and dst '${t.dst}'`, function (done) {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err)
                                                .to.have.property("code")
                                                .to.match(/EPERM|ENOENT|EEXIST/);
                                            //ensure that directories aren't created if there's an error
                                            let statAfter: fs.Stats | undefined;
                                            try {
                                                statAfter = fs.statSync(NodePath.dirname(dst));
                                            } catch (err) {}
                                            expect(statAfter).to.eql(statBefore);
                                            done();
                                        });
                                    });
                                    break;
                                case "dir-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function (done) {
                                        const contentBefore = fs.readdirSync(dst);
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null) => {
                                            expect(err).to.be.null;
                                            //this try catch is for passing at git actions
                                            //try {
                                            const contentAfter = fs.readdirSync(dst);
                                            expect(contentBefore).to.be.eql(contentAfter);
                                            //} catch (err) {}
                                            done();
                                        });
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "'");
                            }
                        });
                    });
                });
            });
            describe("> promises", function () {
                [
                    {
                        name: "> fs.symlink",
                        path: "promises/symlink",
                        fn: fs.promises.symlink,
                    },
                    {
                        name: "> ensureSymLink",
                        path: "promises/ensure",
                        fn: ensure.promises.ensureSymlink,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        before(() => {
                            process.chdir(getPath(d.path, ""));
                            fs.symlinkSync("foo.txt", "real-symlink.txt");
                            fs.symlinkSync("dir-foo", "real-symlink-dir-foo");
                        });
                        tests.forEach((t) => {
                            const src = t.src;
                            const dst = t.dst;
                            switch (d.name === "> fs.symlink" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create a symlink file using '${t.src}' and dst '${t.dst}'`, async function () {
                                        await expect(d.fn(src, dst)).to.eventually.fulfilled;
                                        const relative = ensure.symlinkPathsSync(src, dst);
                                        expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                        const c1 = fs.readFileSync(relative.toCwd, "utf-8");
                                        const c2 = fs.readFileSync(dst, "utf-8");
                                        expect(c1).to.be.equal(c2);
                                        const dstDirContent = fs.readdirSync(NodePath.dirname(dst)) as string[];
                                        expect(dstDirContent.indexOf(NodePath.basename(dst))).to.be.at.least(0);
                                    });
                                    break;
                                case "file-broken":
                                    test(`should create broken symlink file using src '${t.src}' and dst '${t.dst}'`, async function () {
                                        await expect(d.fn(src, dst)).to.eventually.fulfilled;
                                        expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                        expect(
                                            (fs.readdirSync(NodePath.dirname(dst)) as string[]).indexOf(
                                                NodePath.basename(dst)
                                            )
                                        ).to.be.at.least(0);
                                        expect(() => fs.readFileSync(dst, "utf-8"))
                                            .to.throw()
                                            .to.have.property("code", "ENOENT");
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, async function () {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        const err = await expect(d.fn(src, dst)).to.eventually.rejected;
                                        expect(err)
                                            .to.have.property("code")
                                            .to.match(/ENOENT|EEXIST/);
                                        let statAfter: fs.Stats | undefined;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(statAfter).to.eql(statBefore);
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, async function () {
                                        const contentBefore = fs.readFileSync(dst, "utf8");
                                        await expect(d.fn(src, dst)).to.eventually.fulfilled;
                                        const contentAfter = fs.readFileSync(dst, "utf8");
                                        expect(contentBefore).to.be.equal(contentAfter);
                                    });
                                    break;
                                case "dir-success":
                                    test(
                                        "should create symlink dir using src '" + t.src + "' and dst '" + t.dst + "'",
                                        async function () {
                                            await d.fn(src, dst);
                                            const relative = ensure.symlinkPathsSync(src, dst);
                                            expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                            const dirCwd = fs.readdirSync(relative.toCwd);
                                            const dirDst = fs.readdirSync(dst);
                                            expect(dirCwd).to.be.eql(dirDst);
                                            expect(
                                                fs.readdirSync(NodePath.dirname(dst)).indexOf(NodePath.basename(dst))
                                            ).to.be.at.least(0);
                                        }
                                    );
                                    break;
                                case "dir-broken":
                                    test(
                                        "should create broken symlink dir using src '" +
                                            t.src +
                                            "' and dst '" +
                                            t.dst +
                                            "'",
                                        async function () {
                                            await expect(d.fn(src, dst)).to.eventually.fulfilled;
                                            const stat = fs.lstatSync(dst);
                                            const contents = fs.readdirSync(NodePath.dirname(dst));
                                            expect(stat.isSymbolicLink()).to.be.true;
                                            expect(
                                                (contents as string[]).indexOf(NodePath.basename(dst))
                                            ).to.be.at.least(0);
                                            expect(() => fs.readdirSync(dst))
                                                .to.throw()
                                                .to.have.property("code", "ENOENT");
                                        }
                                    );
                                    break;
                                case "dir-error":
                                    test(`should return error when creating symlink dir using src '${t.src}' and dst '${t.dst}'`, async function () {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        const err = await expect(d.fn(src, dst)).to.eventually.rejected;
                                        expect(err)
                                            .to.have.property("code")
                                            .to.match(/EPERM|ENOENT|EEXIST/);
                                        //ensure that directories aren't created if there's an error
                                        let statAfter: fs.Stats | undefined;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(statAfter).to.eql(statBefore);
                                    });
                                    break;
                                case "dir-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, async function () {
                                        const contentBefore = fs.readdirSync(dst);
                                        await expect(d.fn(src, dst)).to.eventually.fulfilled;
                                        //this try catch is for passing at git actions
                                        //try {
                                        const contentAfter = fs.readdirSync(dst);
                                        expect(contentBefore).to.be.eql(contentAfter);
                                        //} catch (err) {}
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "'");
                            }
                        });
                    });
                });
            });
            describe("> sync", function () {
                [
                    {
                        name: "> fs.symlink",
                        path: "sync/symlink",
                        fn: fs.symlinkSync,
                    },
                    {
                        name: "> ensureSymLink",
                        path: "sync/ensure",
                        fn: ensure.ensureSymlinkSync,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        before(() => {
                            process.chdir(getPath(d.path, ""));
                            fs.symlinkSync("foo.txt", "real-symlink.txt");
                            fs.symlinkSync("dir-foo", "real-symlink-dir-foo");
                        });
                        tests.forEach((t) => {
                            const src = t.src;
                            const dst = t.dst;
                            switch (d.name === "> fs.symlink" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create a symlink file using '${t.src}' and dst '${t.dst}'`, function () {
                                        expect(() => d.fn(src, dst)).to.not.throw();
                                        const relative = ensure.symlinkPathsSync(src, dst);
                                        expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                        const c1 = fs.readFileSync(relative.toCwd, "utf-8");
                                        const c2 = fs.readFileSync(dst, "utf-8");
                                        expect(c1).to.be.equal(c2);
                                        const dstDirContent = fs.readdirSync(NodePath.dirname(dst)) as string[];
                                        expect(dstDirContent.indexOf(NodePath.basename(dst))).to.be.at.least(0);
                                    });
                                    break;
                                case "file-broken":
                                    test(`should create broken symlink file using src '${t.src}' and dst '${t.dst}'`, function () {
                                        expect(() => d.fn(src, dst)).to.not.throw();
                                        expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                        expect(
                                            (fs.readdirSync(NodePath.dirname(dst)) as string[]).indexOf(
                                                NodePath.basename(dst)
                                            )
                                        ).to.be.at.least(0);
                                        expect(() => fs.readFileSync(dst, "utf-8"))
                                            .to.throw()
                                            .to.have.property("code", "ENOENT");
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, function () {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(() => d.fn(src, dst))
                                            .to.throw()
                                            .to.have.property("code")
                                            .to.match(/ENOENT|EEXIST/);
                                        let statAfter: fs.Stats | undefined;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(statAfter).to.eql(statBefore);
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function () {
                                        const contentBefore = fs.readFileSync(dst, "utf8");
                                        expect(() => d.fn(src, dst)).to.not.throw();
                                        const contentAfter = fs.readFileSync(dst, "utf8");
                                        expect(contentBefore).to.be.equal(contentAfter);
                                    });
                                    break;
                                case "dir-success":
                                    test(
                                        "should create symlink dir using src '" + t.src + "' and dst '" + t.dst + "'",
                                        function () {
                                            d.fn(src, dst);
                                            //expect(() => d.fn(src, dst)).to.not.throw();
                                            const relative = ensure.symlinkPathsSync(src, dst);
                                            expect(fs.lstatSync(dst).isSymbolicLink()).to.be.true;
                                            //this try catch is for passing at git actions
                                            //try {
                                            const relativeCwd = fs.readdirSync(relative.toCwd);
                                            const dstDir = fs.readdirSync(dst);
                                            expect(relativeCwd).to.be.eql(dstDir);
                                            //expect(fs.readdirSync(relative.toCwd)).to.be.eql(fs.readdirSync(dst));
                                            /*expect(
                                                fs
                                                    .readdirSync(NodePath.dirname(dst))
                                                    .indexOf(NodePath.basename(dst))
                                            ).to.be.at.least(0);*/
                                            //} catch (err) {}
                                        }
                                    );
                                    break;
                                case "dir-broken":
                                    test(
                                        "should create broken symlink dir using src '" +
                                            t.src +
                                            "' and dst '" +
                                            t.dst +
                                            "'",
                                        function () {
                                            expect(() => d.fn(src, dst)).to.not.throw();
                                            const stat = fs.lstatSync(dst);
                                            const contents = fs.readdirSync(NodePath.dirname(dst));
                                            expect(stat.isSymbolicLink()).to.be.true;
                                            expect(
                                                (contents as string[]).indexOf(NodePath.basename(dst))
                                            ).to.be.at.least(0);
                                            expect(() => fs.readdirSync(dst))
                                                .to.throw()
                                                .to.have.property("code", "ENOENT");
                                        }
                                    );
                                    break;
                                case "dir-error":
                                    test(`should return error when creating symlink dir using src '${t.src}' and dst '${t.dst}'`, function () {
                                        let statBefore: fs.Stats | undefined;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(() => d.fn(src, dst))
                                            .to.throw()
                                            .to.have.property("code")
                                            .to.match(/EPERM|ENOENT|EEXIST/);
                                        //ensure that directories aren't created if there's an error
                                        let statAfter: fs.Stats | undefined;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        expect(statAfter).to.eql(statBefore);
                                    });
                                    break;
                                case "dir-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function () {
                                        const contentBefore = fs.readdirSync(dst);
                                        expect(() => d.fn(src, dst)).to.not.throw();
                                        //this try catch is for passing at git actions
                                        //try {
                                        const contentAfter = fs.readdirSync(dst);
                                        expect(contentBefore).to.be.eql(contentAfter);
                                        //} catch (err) {}
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "'");
                            }
                        });
                    });
                });
            });
        });
    });
});
