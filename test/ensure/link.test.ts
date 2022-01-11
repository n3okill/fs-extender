import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
import { Type } from "@n3okill/utils";
import NodePath from "path-extender";
use(chaiAsPromised);

import * as NodeFs from "fs";
import * as fs from "../../src/patch/patch.js";
import * as ensure from "../../src/ensure/index.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    async: {
        link: {
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
        link: {
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
        link: {
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

function getPathRelative(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPathRelative([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPathRelative(arg);
}

describe("fs-extender", function () {
    describe("> ensure", function () {
        describe("> link", function () {
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
                    dst: "./link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./dir-foo/link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./empty-dir/link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/real-beta/link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./real-alpha/real-beta/real-gamma/link.txt",
                    fs: "file-success",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/link.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/beta/link.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./foo.txt",
                    dst: "./alpha/beta/gamma/link.txt",
                    fs: "file-error",
                    ensure: "file-success",
                },
                {
                    src: "./missing.txt",
                    dst: "./link.txt",
                    fs: "file-error",
                    ensure: "file-error",
                },
                {
                    src: "./missing.txt",
                    dst: "./missing-dir/link.txt",
                    fs: "file-error",
                    ensure: "file-error",
                },
                {
                    src: "./foo.txt",
                    dst: "./link.txt",
                    fs: "file-dst-exists",
                    ensure: "file-success",
                },
                {
                    src: "./dir-foo/foo.txt",
                    dst: "./link.txt",
                    fs: "file-dst-exists",
                    ensure: "file-dst-exists",
                },
                {
                    src: "./missing.txt",
                    dst: "./link.txt",
                    fs: "file-error",
                    ensure: "file-error",
                },
                {
                    src: "../foo.txt",
                    dst: "./link.txt",
                    fs: "file-error",
                    ensure: "file-error",
                },
                {
                    src: "../dir-foo/foo.txt",
                    dst: "./link.txt",
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
            ];
            describe("> async", function () {
                [
                    { name: "> fs.link", path: "async/link", fn: NodeFs.link },
                    {
                        name: "> ensureLink",
                        path: "async/ensure",
                        fn: ensure.ensureLink,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        tests.forEach((t) => {
                            const src = getPathRelative(d.path, t.src);
                            const dst = getPathRelative(d.path, t.dst);
                            switch (d.name === "> fs.link" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create link file using '${t.src}' and dst '${t.dst}'`, function (done) {
                                        d.fn(src, dst, (err: NodeJS.ErrnoException | null): void => {
                                            expect(err).to.be.null;
                                            const srcContent = fs.readFileSync(src, "utf-8");
                                            const dstDir = NodePath.dirname(dst);
                                            const dstBasename = NodePath.basename(dst);
                                            expect(fs.lstatSync(dst).isFile()).to.be.true;
                                            expect(fs.readFileSync(dst, "utf-8")).to.be.equal(srcContent);
                                            expect(
                                                (fs.readdirSync(dstDir) as string[]).indexOf(dstBasename)
                                            ).to.be.at.least(0);
                                            done();
                                        });
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, function (done) {
                                        fs.stat(
                                            NodePath.dirname(dst),
                                            (errStatBefore: NodeJS.ErrnoException | null, statBefore?): void => {
                                                d.fn(src, dst, (err: NodeJS.ErrnoException | null): void => {
                                                    expect(err).not.to.be.null;
                                                    fs.stat(
                                                        NodePath.dirname(dst),
                                                        (
                                                            errStatAfter: NodeJS.ErrnoException | null,
                                                            statAfter?
                                                        ): void => {
                                                            if (typeof statBefore === "undefined") {
                                                                expect(statAfter).not.to.exist;
                                                                return done();
                                                            }
                                                            expect(statAfter).to.be.eql(statBefore);
                                                            done();
                                                        }
                                                    );
                                                });
                                            }
                                        );
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function (done) {
                                        fs.readFile(
                                            dst,
                                            "utf-8",
                                            (errReadFile: NodeJS.ErrnoException | null, contentBefore): void => {
                                                d.fn(src, dst, (err: NodeJS.ErrnoException | null): void => {
                                                    expect(err).not.to.be.null;
                                                    fs.readFile(
                                                        dst,
                                                        "utf8",
                                                        (
                                                            errAfter: NodeJS.ErrnoException | null,
                                                            contentAfter
                                                        ): void => {
                                                            expect(contentBefore).to.be.equal(contentAfter);
                                                            done();
                                                        }
                                                    );
                                                });
                                            }
                                        );
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "' + '" + d.name + "'");
                            }
                        });
                    });
                });
            });
            describe("> promises", function () {
                [
                    {
                        name: "> fs.link",
                        path: "promises/link",
                        fn: NodeFs.promises.link,
                    },
                    {
                        name: "> ensureLink",
                        path: "promises/ensure",
                        fn: ensure.promises.ensureLink,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        tests.forEach((t) => {
                            const src = getPathRelative(d.path, t.src);
                            const dst = getPathRelative(d.path, t.dst);
                            switch (d.name === "> fs.link" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create link file using '${t.src}' and dst '${t.dst}'`, async function () {
                                        await d.fn(src, dst);
                                        const srcContent = fs.readFileSync(src, "utf-8");
                                        const dstDir = NodePath.dirname(dst);
                                        const dstBasename = NodePath.basename(dst);
                                        expect(fs.lstatSync(dst).isFile()).to.be.true;
                                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal(srcContent);
                                        expect(
                                            (fs.readdirSync(dstDir) as string[]).indexOf(dstBasename)
                                        ).to.be.at.least(0);
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, async function () {
                                        let statBefore;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}

                                        const err = await expect(d.fn(src, dst)).to.eventually.rejected;
                                        expect(err).not.to.be.null;
                                        let statAfter;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        if (typeof statBefore === "undefined") {
                                            expect(statAfter).not.to.exist;
                                            return;
                                        }
                                        expect(statAfter).to.be.eql(statBefore);
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, async function () {
                                        const contentBefore = fs.readFileSync(dst, "utf-8");
                                        const err = await expect(d.fn(src, dst)).to.eventually.rejected;
                                        expect(err).not.to.be.null;
                                        const contentAfter = fs.readFileSync(dst, "utf8");
                                        expect(contentBefore).to.be.equal(contentAfter);
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "' + '" + d.name + "'");
                            }
                        });
                    });
                });
            });
            describe("> sync", function () {
                [
                    {
                        name: "> fs.link",
                        path: "sync/link",
                        fn: NodeFs.linkSync,
                    },
                    {
                        name: "> ensureLink",
                        path: "sync/ensure",
                        fn: ensure.ensureLinkSync,
                    },
                ].forEach((d) => {
                    describe(d.name, function () {
                        tests.forEach((t) => {
                            const src = getPathRelative(d.path, t.src);
                            const dst = getPathRelative(d.path, t.dst);
                            switch (d.name === "> fs.link" ? t.fs : t.ensure) {
                                case "file-success":
                                    test(`should create link file using '${t.src}' and dst '${t.dst}'`, function () {
                                        d.fn(src, dst);
                                        const srcContent = fs.readFileSync(src, "utf-8");
                                        const dstDir = NodePath.dirname(dst);
                                        const dstBasename = NodePath.basename(dst);
                                        expect(fs.lstatSync(dst).isFile()).to.be.true;
                                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal(srcContent);
                                        expect(
                                            (fs.readdirSync(dstDir) as string[]).indexOf(dstBasename)
                                        ).to.be.at.least(0);
                                    });
                                    break;
                                case "file-error":
                                    test(`should throw error using '${t.src}' and dst '${t.dst}'`, function () {
                                        let statBefore;
                                        try {
                                            statBefore = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}

                                        const err = expect(() => d.fn(src, dst)).to.throw();
                                        expect(err).not.to.be.null;
                                        let statAfter;
                                        try {
                                            statAfter = fs.statSync(NodePath.dirname(dst));
                                        } catch (err) {}
                                        if (typeof statBefore === "undefined") {
                                            expect(statAfter).not.to.exist;
                                            return;
                                        }
                                        expect(statAfter).to.be.eql(statBefore);
                                    });
                                    break;
                                case "file-dst-exists":
                                    test(`should do nothing using src '${t.src}' and dst '${t.dst}'`, function () {
                                        const contentBefore = fs.readFileSync(dst, "utf-8");
                                        const err = expect(() => d.fn(src, dst)).to.throw();
                                        expect(err).not.to.be.null;
                                        const contentAfter = fs.readFileSync(dst, "utf8");
                                        expect(contentBefore).to.be.equal(contentAfter);
                                    });
                                    break;
                                default:
                                    throw new Error("Invalid option '" + t.fs + "' + '" + d.name + "'");
                            }
                        });
                    });
                });
            });
        });
    });
});
