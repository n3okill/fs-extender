import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, test } from "mocha";
use(chaiAsPromised);

import * as NodeFs from "fs";
import * as fs from "../../src/patch";
import rewiremock from "rewiremock";

const mockFs = rewiremock.proxy(
    () => require("../../src/patch/patch"),
    (r) => ({
        fs: r
            .directChildOnly()
            .toBeUsed()
            .with({
                stat: function (
                    path: NodeFs.PathLike,
                    options: unknown,
                    callback: (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => void
                ) {
                    NodeFs.stat(path, (err: NodeJS.ErrnoException | null, stats: NodeFs.Stats) => {
                        if (!err) {
                            stats.gid = -2;
                            stats.uid = -2;
                        }
                        callback(err, stats);
                    });
                },
                statSync: function (path: NodeFs.PathLike, options: never) {
                    const stats = NodeFs.statSync(path, options);
                    stats.gid = -2;
                    stats.uid = -2;
                    return stats;
                },
            }),
    })
);
const mockFsPromises = rewiremock.proxy(
    () => require("../../src/patch/promises"),
    (r) => ({
        "./patch": r.directChildOnly().toBeUsed().with(mockFs),
    })
);

describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> stats", function () {
            describe("> async", function () {
                describe("> Stats", function () {
                    test("should use the same stats constructor as fs module", function (done) {
                        NodeFs.stat(__filename, (err: NodeJS.ErrnoException | null, statFs: unknown): void => {
                            expect(err).to.be.null;
                            expect(statFs).to.be.instanceOf(NodeFs.Stats);
                            fs.stat(__filename, (errEnfs: NodeJS.ErrnoException | null, statEnfs: unknown): void => {
                                expect(errEnfs).to.be.null;
                                expect(statEnfs).to.be.instanceOf(NodeFs.Stats);
                                done();
                            });
                        });
                    });
                    test("throw when file doesn't exist", function (done) {
                        fs.stat("/not/existent/file", (err: NodeJS.ErrnoException | null, stats: unknown): void => {
                            expect(err).not.to.be.null;
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                            expect(stats).not.to.exist;
                            done();
                        });
                    });
                });
                describe("> Stats uid gid", function () {
                    test("stat uid and gid", function (done) {
                        mockFs.stat(
                            __filename,
                            (enfsErr: NodeJS.ErrnoException | null, enfsStats: NodeFs.Stats): void => {
                                expect(enfsErr).to.be.null;
                                expect(enfsStats.uid).to.be.equal(0xfffffffe);
                                expect(enfsStats.gid).to.be.equal(0xfffffffe);
                                done();
                            }
                        );
                    });
                });
            });
            describe("> promises", function () {
                describe("> Stats", function () {
                    test("should use the same stats constructor as fs module", async function () {
                        const statFs = await NodeFs.promises.stat(__filename);
                        expect(statFs).to.be.instanceOf(NodeFs.Stats);
                        const statPatch = await fs.promises.stat(__filename);
                        expect(statPatch).to.be.instanceOf(NodeFs.Stats);
                    });
                    test("throw when file doesn't exist in async", async function () {
                        const err = await expect(fs.promises.stat("/not/existent/file")).to.eventually.rejectedWith();
                        expect((err as unknown as NodeJS.ErrnoException).code).to.equal("ENOENT");
                    });
                });
                describe("> Stats uid gid", function () {
                    test("stat uid and gid", async function () {
                        const stats = await mockFsPromises.stat(__filename);
                        expect(stats.uid).to.be.equal(0xfffffffe);
                        expect(stats.gid).to.be.equal(0xfffffffe);
                    });
                });
            });
            describe("> sync", function () {
                describe("> Stats", function () {
                    test("should use the same stats constructor as fs module", function () {
                        const statFs = NodeFs.statSync(__filename);
                        expect(statFs).to.be.instanceOf(NodeFs.Stats);
                        const statPatch = fs.statSync(__filename);
                        expect(statPatch).to.be.instanceOf(NodeFs.Stats);
                    });
                    test("throw when file doesn't exist in sync", function () {
                        expect(() => fs.statSync("/not/existent/file")).throw(/ENOENT: no such file/);
                    });
                });
                describe("> Stats uid gid", function () {
                    test("stat uid and gid", function () {
                        const stats = mockFs.statSync(__filename);
                        expect(stats.uid).to.be.equal(0xfffffffe);
                        expect(stats.gid).to.be.equal(0xfffffffe);
                    });
                });
            });
        });
    });
});
