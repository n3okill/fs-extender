import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch/patch.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {
    async: {
        file: "content",
        folder: {
            file: "content",
        },
    },
    promises: {
        file: "content",
        folder: {
            file: "content",
        },
    },
    sync: {
        file: "content",
        folder: {
            file: "content",
        },
    },
};

const common = new Common("fs-extender-patch-symlink", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        (common.canSymlinkTest ? describe : describe.skip)("> symlink", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                test("should test symlink on file", function (done) {
                    const src = common.getPath(["async", "file"]);
                    const dst = `${src}_symlink`;
                    fs.symlink(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                        const readSrc = fs.readFileSync(src, "utf-8");
                        const readDst = fs.readFileSync(dst, "utf-8");
                        expect(readSrc).to.be.equal(readDst);
                        done();
                    });
                });
                test("should test symlink on dir", function (done) {
                    const src = common.getPath(["async", "folder"]);
                    const dst = `${src}_symlink`;
                    fs.symlink(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                        const readSrc = fs.readdirSync(src);
                        const readDst = fs.readdirSync(dst);
                        expect(readSrc).to.be.eql(readDst);
                        done();
                    });
                });
            });
            describe("> promises", function () {
                test("should test symlink on file", async function () {
                    const src = common.getPath(["promises", "file"]);
                    const dst = `${src}_symlink`;
                    await fs.promises.symlink(src, dst);
                    expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                    const readSrc = fs.readFileSync(src, "utf-8");
                    const readDst = fs.readFileSync(dst, "utf-8");
                    expect(readSrc).to.be.equal(readDst);
                });
                test("should test symlink on dir", async function () {
                    const src = common.getPath(["promises", "folder"]);
                    const dst = `${src}_symlink`;
                    await fs.promises.symlink(src, dst);
                    expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                    const readSrc = fs.readdirSync(src);
                    const readDst = fs.readdirSync(dst);
                    expect(readSrc).to.be.eql(readDst);
                });
            });
            describe("> sync", function () {
                test("should test symlink on file", function () {
                    const src = common.getPath(["sync", "file"]);
                    const dst = `${src}_symlink`;
                    fs.symlinkSync(src, dst);
                    expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                    const readSrc = fs.readFileSync(src, "utf-8");
                    const readDst = fs.readFileSync(dst, "utf-8");
                    expect(readSrc).to.be.equal(readDst);
                });
                test("should test symlink on dir", function () {
                    const src = common.getPath(["sync", "folder"]);
                    const dst = `${src}_symlink`;
                    fs.symlinkSync(src, dst);
                    expect(fs.statIsSymbolicLinkSync(dst)).to.be.true;
                    const readSrc = fs.readdirSync(src);
                    const readDst = fs.readdirSync(dst);
                    expect(readSrc).to.be.eql(readDst);
                });
            });
        });
    });
});
