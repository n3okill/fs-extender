import { expect } from "chai";
import { describe, test } from "mocha";

import * as fs from "../../src/patch/patch.js";
import rewiremock from "rewiremock";
const mockFs = rewiremock.proxy(
    () => require("../../src/patch/patch.js"),
    (r) => ({
        fs: r
            .directChildOnly()
            .toBeUsed()
            .with({
                readdir: function (
                    path: fs.PathLike,
                    options: unknown,
                    callback: (err: NodeJS.ErrnoException | null, files: string[]) => void
                ): void {
                    process.nextTick(function (): void {
                        callback(null, ["c", "x", "b"]);
                    });
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                readdirSync: function (path: fs.PathLike, options: unknown): string[] {
                    return ["c", "x", "b"];
                },
            }),
    })
);
const mockFsPromises = rewiremock.proxy(
    () => require("../../src/patch/promises.js"),
    (r) => ({
        "./patch": r.directChildOnly().toBeUsed().with(mockFs),
    })
);
describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> readDir", function () {
            describe("> async", function () {
                test("should test readdir reorder", function (done) {
                    mockFs.readdir(__dirname, (err: NodeJS.ErrnoException | null, files: string[]) => {
                        expect(err).to.be.null;
                        expect(files).to.eql(["b", "c", "x"]);
                        done();
                    });
                });
            });
            describe("> promises", function () {
                test("should test readdir reorder with promise", async function () {
                    expect(await mockFsPromises.readdir(__dirname)).to.eql(["b", "c", "x"]);
                });
            });
            describe("> sync", function () {
                test("should test readdir reorder sync", function () {
                    expect(mockFs.readdirSync(__dirname)).to.eql(["b", "c", "x"]);
                });
            });
        });
    });
});
