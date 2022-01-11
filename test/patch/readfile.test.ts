import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch/patch.js";
import { Common, TestDirStructure } from "../Common.js";

const drive: TestDirStructure = {};

const common = new Common("fs-extender-patch-readfile", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> readfile", function () {
            describe("> async", function () {
                test("should write new file and read contents with *File functions", function (done) {
                    fs.writeFile(
                        common.getPath("async.txt"),
                        "async data",
                        "utf-8",
                        (errWrite: NodeJS.ErrnoException | null): void => {
                            expect(errWrite).to.be.null;
                            fs.readFile(
                                common.getPath("async.txt"),
                                "utf-8",
                                (err: NodeJS.ErrnoException | null, result: string): void => {
                                    expect(result).to.be.equal("async data");
                                    done();
                                }
                            );
                        }
                    );
                });
                test("should write new file and read contents", function (done) {
                    const content = "hello world!";
                    fs.open(
                        common.getPath("async2.txt"),
                        "w+",
                        (err: NodeJS.ErrnoException | null, fd: number): void => {
                            expect(err).to.be.null;
                            fs.write(
                                fd,
                                content,
                                (
                                    errWrite: NodeJS.ErrnoException | null,
                                    bytesWritten: number,
                                    strWritten: string
                                ): void => {
                                    expect(errWrite).to.be.null;
                                    expect(strWritten).to.be.equal(content);
                                    expect(bytesWritten).to.be.greaterThan(0);
                                    const buffer = Buffer.alloc(bytesWritten);
                                    fs.read(
                                        fd,
                                        buffer,
                                        0,
                                        bytesWritten,
                                        0,
                                        (errRead: NodeJS.ErrnoException | null, bytesRead: number, b: Buffer): void => {
                                            expect(errRead).to.be.null;
                                            expect(bytesRead).to.be.greaterThan(0);
                                            expect(bytesRead).to.be.equal(bytesWritten);
                                            expect(b.toString()).to.be.equal(content);
                                            fs.close(fd, done);
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
            describe("> promises", function () {
                test("should write new file and read with promises", async function () {
                    await fs.promises.writeFile(common.getPath("promise1.txt"), "promise data", "utf-8");
                    expect(await fs.promises.readFile(common.getPath("promise1.txt"), "utf-8")).to.be.equal(
                        "promise data"
                    );
                });
            });
        });
        describe("streams", function () {
            test("write streams", function (done) {
                const stream = fs.createWriteStream(common.getPath("stream.txt"));
                stream.on("finish", (): void => {
                    const read = fs.createReadStream(common.getPath("stream.txt"));
                    let data = "";
                    read.on("data", (c: unknown): void => {
                        data += c;
                    });
                    read.on("end", (): void => {
                        expect(data).to.be.equal("content");
                        done();
                    });
                });
                stream.write("content");
                stream.end();
            });
        });
    });
});
