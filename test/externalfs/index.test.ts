import NodePath from "path-extender";
process.env["FS_EXTENDER_FS_OVERRIDE"] = NodePath.join(__dirname, "fs.js");

import { expect, use } from "chai";
import { describe, test } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);
import * as fs from "../../src/patch";

describe("fs-extender", function () {
    describe("> external fs", function () {
        describe("> async", function () {
            test("exists always true", function (done) {
                fs.exists("don't exist", (err: NodeJS.ErrnoException | null, result: boolean) => {
                    expect(err).to.be.null;
                    expect(result).to.be.true;
                    done();
                });
            });
            test("stat does not exist", function (done) {
                try {
                    fs.stat(__filename, (err: NodeJS.ErrnoException | null, stats: fs.Stats) => {
                        expect(err).to.be.null;
                        expect(stats.isFile()).to.be.true;
                        done();
                    });
                } catch (err) {
                    expect(err).to.match(
                        /Function.prototype.apply was called on undefined, which is a undefined and not a function/
                    );
                    done();
                }
            });
        });
        describe("> promises", function () {
            test("exists always true", async function () {
                expect(await fs.promises.exists("don't exist")).to.be.true;
            });
            test("stat does not exist", async function () {
                const err = await expect(fs.promises.stat(__filename)).to.eventually.be.rejected;
                expect(err).to.match(
                    /Function.prototype.apply was called on undefined, which is a undefined and not a function/
                );
            });
        });
        describe("> sync", function () {
            test("exists always true", async function () {
                expect(fs.existsSync("don't exist")).to.be.true;
            });
            test("stat does not exist", function () {
                expect(() => fs.statSync(__filename)).to.throw(
                    /Function.prototype.apply was called on undefined, which is a undefined and not a function/
                );
            });
        });
    });
});
