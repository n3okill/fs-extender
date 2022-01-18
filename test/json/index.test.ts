import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
import { Type } from "@n3okill/utils";
use(chaiAsPromised);

import * as fs from "../../src/patch/patch";
import * as json from "../../src/json/index";
import { Common, TestDirStructure } from "../Common";

const readFileObj = { obj: 123 };
const day = new Date();
const drive: TestDirStructure = {
    readFile: {
        "file.json": JSON.stringify(readFileObj),
        "invalid.json": "{",
        "reviver.json": JSON.stringify({ day: day, obj: 123 }),
        "bom.json": `\uFEFF${JSON.stringify(readFileObj)}`,
        "lines.jsonl": `${JSON.stringify({ obj: 1 })}\n${JSON.stringify({
            obj: 2,
        })}\n${JSON.stringify({ obj: 3 })}\n${JSON.stringify({ obj: 4 })}`,
    },
    async: {
        writeFile: {},
        ensureFile: {},
    },
    promises: {
        writeFile: {},
        ensureFile: {},
    },
    sync: {
        writeFile: {},
        ensureFile: {},
    },
};

const common = new Common("fs-extender-json", drive);

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

describe("fs-extender", function () {
    describe("> json", function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function reviver(key: string, value: any) {
            if (key === "day") {
                return new Date(value);
            }
            return value;
        }
        function replacer(key: string, value: unknown) {
            if (key === "day") {
                return "date:" + (value as Date).toString();
            }
            return value;
        }
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> async", function () {
            describe("> readJsonFile", function () {
                test("should read and parse JSON", function (done) {
                    const file = common.getPath("readFile/file.json");
                    json.readJsonFile(file, (err: NodeJS.ErrnoException | null, obj: typeof readFileObj) => {
                        expect(err).to.be.null;
                        expect(obj).to.be.eql(readFileObj);
                        done();
                    });
                });
                test("when throw option is false file is invalid", function (done) {
                    const file = common.getPath("readFile/invalid.json");
                    json.readJsonFile(file, { throws: false }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("when throw option is true (default) and file is invalid", function (done) {
                    const file = common.getPath("readFile/invalid.json");
                    json.readJsonFile(file, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.not.be.null;
                        expect(err).to.have.property("message").to.have.string(file);
                        done();
                    });
                });
                test("when throw option is false and file is missing", function (done) {
                    const file = common.getPath("readFile/missing.json");
                    json.readJsonFile(file, { throws: false }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        done();
                    });
                });
                test("when throw option is true (default)", function (done) {
                    const file = common.getPath("readFile/missing.json");
                    json.readJsonFile(file, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.not.be.null;
                        expect(err).to.have.property("message").to.have.string(file);
                        done();
                    });
                });
                test("should test reviver and transform json object", function (done) {
                    const file = common.getPath("readFile/reviver.json");
                    json.readJsonFile(
                        file,
                        { reviver: reviver },
                        (err: NodeJS.ErrnoException | null, obj: { day: Date; obj: number }) => {
                            expect(err).to.be.null;
                            expect(obj).to.have.property("day").to.be.instanceOf(Date).to.be.eql(day);
                            done();
                        }
                    );
                });
                test("stripBom", function (done) {
                    const file = common.getPath("readFile/bom.json");
                    json.readJsonFile(file, (err: NodeJS.ErrnoException | null, obj: typeof readFileObj) => {
                        expect(err).to.be.null;
                        expect(obj).to.be.eql(readFileObj);
                        done();
                    });
                });
            });
            describe("> readJsonLines", function () {
                test("should read and parse JSON", function (done) {
                    const file = common.getPath("readFile/lines.jsonl");
                    let count = 0;
                    const result: unknown[] = [];
                    json.readJsonLines(
                        file,
                        (obj: unknown) => {
                            count++;
                            result.push(obj);
                            return true;
                        },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            expect(count).to.be.equal(4);
                            expect(result).to.be.eql([{ obj: 1 }, { obj: 2 }, { obj: 3 }, { obj: 4 }]);
                            done();
                        }
                    );
                });
                test("when throw option is false file is invalid", function (done) {
                    const file = common.getPath("readFile/invalid.json");
                    json.readJsonLines(
                        file,
                        { throws: false },
                        () => true,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
                test("when throw option is true (default) and file is invalid", function (done) {
                    const file = common.getPath("readFile/invalid.json");
                    json.readJsonLines(
                        file,
                        () => true,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.have.property("message").to.have.string("Line");
                            done();
                        }
                    );
                });
                test("when throw option is false and file is missing", function (done) {
                    const file = common.getPath("readFile/missing.json");
                    json.readJsonLines(
                        file,
                        { throws: false },
                        () => true,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
                test("when throw option is true (default)", function (done) {
                    const file = common.getPath("readFile/missing.json");
                    json.readJsonLines(
                        file,
                        () => true,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.have.property("message").to.have.string("readJsonLines");
                            done();
                        }
                    );
                });
            });
            describe("> writeJsonFile", function () {
                test("should stringify and write json file", function (done) {
                    const obj = { age: 456 };
                    const path = getPath("async/writeFile", "t1.json");
                    json.writeJsonFile(path, obj, (err: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                        expect(err).to.be.null;
                        expect(p).to.be.equal(path);
                        const content = fs.readFileSync(path, {
                            encoding: "utf-8",
                        });
                        expect(JSON.parse(content)).to.be.eql(obj);
                        done();
                    });
                });
                test("should test replace and transform json string", function (done) {
                    const path = getPath("async/writeFile", "t2.json");
                    json.writeJsonFile(
                        path,
                        { day: new Date(), age: 456 },
                        { replacer: replacer },
                        (err: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(p).to.be.equal(path);
                            const content = fs.readFileSync(path, {
                                encoding: "utf-8",
                            });
                            expect(JSON.parse(content))
                                .to.have.property("day")
                                .to.match(/date:.*/);
                            done();
                        }
                    );
                });
                test("should write file with spaces", function (done) {
                    const path = getPath("async/writeFile", "t3.json");
                    json.writeJsonFile(
                        path,
                        { age: 456 },
                        { spaces: 4 },
                        (err: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(p).to.be.equal(path);
                            const content = fs.readFileSync(path, {
                                encoding: "utf-8",
                            });
                            expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                            done();
                        }
                    );
                });
                test("should use EOL option", function (done) {
                    const path = getPath("async/writeFile", "t4.json");
                    json.writeJsonFile(
                        path,
                        { age: 456 },
                        { spaces: 2, EOL: "--" },
                        (err: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(p).to.be.equal(path);
                            const content = fs.readFileSync(path, {
                                encoding: "utf-8",
                            });
                            expect(content).to.be.equal(`{--  "age": 456--}--`);
                            done();
                        }
                    );
                });
                test("should test finalEOL options = false", function (done) {
                    const path = getPath("async/writeFile", "t5.json");
                    json.writeJsonFile(
                        path,
                        { age: 456 },
                        { spaces: 2, EOL: "--", finalEOL: false },
                        (err: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                            expect(err).to.be.null;
                            expect(p).to.be.equal(path);
                            const content = fs.readFileSync(path, {
                                encoding: "utf-8",
                            });
                            expect(content).to.be.equal(`{--  "age": 456--}`);
                            done();
                        }
                    );
                });
            });
            describe("> ensureJsonFile", function () {
                test("should stringify and write json file", function (done) {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("async/ensureFile", [x, y, "t1.json"]);
                    const obj = { age: 456 };
                    json.writeJsonFile(path, obj, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.not.be.null;
                        json.ensureJsonFile(path, obj, (err2: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                            expect(err2).to.be.null;
                            expect(p).to.be.equal(path);
                            const content = fs.readFileSync(path, {
                                encoding: "utf-8",
                            });
                            expect(JSON.parse(content)).to.be.eql(obj);
                            done();
                        });
                    });
                });
                test("should test replace and transform json string", function (done) {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("async/ensureFile", [x, y, "t2.json"]);
                    json.writeJsonFile(
                        path,
                        { day: new Date(), age: 456 },
                        { replacer: replacer },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.not.be.null;
                            json.ensureJsonFile(
                                path,
                                { day: new Date(), age: 456 },
                                { replacer: replacer },
                                (err2: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                                    expect(err2).to.be.null;
                                    expect(p).to.be.equal(path);
                                    const content = fs.readFileSync(path, {
                                        encoding: "utf-8",
                                    });
                                    expect(JSON.parse(content))
                                        .to.have.property("day")
                                        .to.match(/date:.*/);
                                    done();
                                }
                            );
                        }
                    );
                });
                test("should write file with spaces", function (done) {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("async/ensureFile", [x, y, "t3.json"]);
                    json.writeJsonFile(path, { age: 456 }, { spaces: 4 }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.not.be.null;
                        json.ensureJsonFile(
                            path,
                            { age: 456 },
                            { spaces: 4 },
                            (err2: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                                expect(err2).to.be.null;
                                expect(p).to.be.equal(path);
                                const content = fs.readFileSync(path, {
                                    encoding: "utf-8",
                                });
                                expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                                done();
                            }
                        );
                    });
                });
                test("should use EOL option", function (done) {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("async/ensureFile", [x, y, "t4.json"]);
                    json.writeJsonFile(
                        path,
                        { age: 456 },
                        { spaces: 2, EOL: "--" },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.not.be.null;
                            json.ensureJsonFile(
                                path,
                                { age: 456 },
                                { spaces: 2, EOL: "--" },
                                (err2: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                                    expect(err2).to.be.null;
                                    expect(p).to.be.equal(path);
                                    const content = fs.readFileSync(path, {
                                        encoding: "utf-8",
                                    });
                                    expect(content).to.be.equal(`{--  "age": 456--}--`);
                                    done();
                                }
                            );
                        }
                    );
                });
                test("should test finalEOL options = false", function (done) {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("async/ensureFile", [x, y, "t5.json"]);
                    json.writeJsonFile(
                        path,
                        { age: 456 },
                        { spaces: 2, EOL: "--", finalEOL: false },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.not.be.null;
                            json.ensureJsonFile(
                                path,
                                { age: 456 },
                                { spaces: 2, EOL: "--", finalEOL: false },
                                (err2: NodeJS.ErrnoException | null, p: fs.PathLike) => {
                                    expect(err2).to.be.null;
                                    expect(p).to.be.equal(path);
                                    const content = fs.readFileSync(path, {
                                        encoding: "utf-8",
                                    });
                                    expect(content).to.be.equal(`{--  "age": 456--}`);
                                    done();
                                }
                            );
                        }
                    );
                });
            });
        });
        describe("> promises", function () {
            describe("> readJsonFile", function () {
                test("should read and parse JSON", async function () {
                    const file = common.getPath("readFile/file.json");
                    expect(await json.promises.readJsonFile(file)).to.be.eql(readFileObj);
                });
                test("when throw option is false file is invalid", async function () {
                    const file = common.getPath("readFile/invalid.json");
                    await expect(json.promises.readJsonFile(file, { throws: false })).to.not.be.eventually.rejected;
                });
                test("when throw option is true (default) and file is invalid", async function () {
                    const file = common.getPath("readFile/invalid.json");
                    await expect(json.promises.readJsonFile(file))
                        .to.eventually.be.rejected.to.have.property("message")
                        .to.have.string(file);
                });
                test("when throw option is false and file is missing", async function () {
                    const file = common.getPath("readFile/missing.json");
                    await expect(json.promises.readJsonFile(file, { throws: false })).to.not.be.eventually.rejected;
                });
                test("when throw option is true (default)", async function () {
                    const file = common.getPath("readFile/missing.json");
                    await expect(json.promises.readJsonFile(file))
                        .to.eventually.be.rejected.to.have.property("message")
                        .to.have.string(file);
                });
                test("should test reviver and transform json object", async function () {
                    const file = common.getPath("readFile/reviver.json");
                    const obj = await json.promises.readJsonFile(file, {
                        reviver: reviver,
                    });
                    expect(obj).to.have.property("day").to.be.instanceOf(Date).to.be.eql(day);
                });
                test("stripBom", async function () {
                    const file = common.getPath("readFile/bom.json");
                    expect(await json.promises.readJsonFile(file)).to.be.eql(readFileObj);
                });
            });
            describe("> readJsonLines", function () {
                test("should read and parse JSON", async function () {
                    const file = common.getPath("readFile/lines.jsonl");
                    let count = 0;
                    const result: unknown[] = [];
                    await json.promises.readJsonLines(file, (obj: unknown) => {
                        count++;
                        result.push(obj);
                        return true;
                    });
                    expect(count).to.be.equal(4);
                    expect(result).to.be.eql([{ obj: 1 }, { obj: 2 }, { obj: 3 }, { obj: 4 }]);
                });
                test("when throw option is false file is invalid", async function () {
                    const file = common.getPath("readFile/invalid.json");
                    await expect(json.promises.readJsonLines(file, { throws: false }, () => true)).to.not.be.eventually
                        .rejected;
                });
                test("when throw option is true (default) and file is invalid", async function () {
                    const file = common.getPath("readFile/invalid.json");
                    await expect(json.promises.readJsonLines(file, () => true))
                        .to.eventually.be.rejected.to.have.property("message")
                        .to.have.string("Line");
                });
                test("when throw option is false and file is missing", async function () {
                    const file = common.getPath("readFile/missing.json");
                    await expect(json.promises.readJsonLines(file, { throws: false }, () => true)).to.not.be.eventually
                        .rejected;
                });
                test("when throw option is true (default)", async function () {
                    const file = common.getPath("readFile/missing.json");
                    await expect(json.promises.readJsonLines(file, () => true))
                        .to.eventually.be.rejected.to.have.property("message")
                        .to.have.string("readJsonLines");
                });
            });
            describe("> writeJsonFile", function () {
                test("should stringify and write json file", async function () {
                    const obj = { age: 456 };
                    await expect(json.promises.writeJsonFile(getPath("promises/writeFile", "t1.json"), obj)).to.not.be
                        .eventually.rejected;
                    const content = fs.readFileSync(getPath("promises/writeFile", "t1.json"), { encoding: "utf-8" });
                    expect(JSON.parse(content)).to.be.eql(obj);
                });
                test("should test replace and transform json string", async function () {
                    await expect(
                        json.promises.writeJsonFile(
                            getPath("promises/writeFile", "t2.json"),
                            { day: new Date(), age: 456 },
                            { replacer: replacer }
                        )
                    ).to.not.be.eventually.rejected;
                    const content = fs.readFileSync(getPath("promises/writeFile", "t2.json"), { encoding: "utf-8" });
                    expect(JSON.parse(content))
                        .to.have.property("day")
                        .to.match(/date:.*/);
                });
                test("should write file with spaces", async function () {
                    await expect(
                        json.promises.writeJsonFile(
                            getPath("promises/writeFile", "t3.json"),
                            { age: 456 },
                            { spaces: 4 }
                        )
                    ).to.not.be.eventually.rejected;
                    const content = fs.readFileSync(getPath("promises/writeFile", "t3.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                });
                test("should use EOL option", async function () {
                    await expect(
                        json.promises.writeJsonFile(
                            getPath("promises/writeFile", "t4.json"),
                            { age: 456 },
                            { spaces: 2, EOL: "--" }
                        )
                    ).to.not.be.eventually.rejected;
                    const content = fs.readFileSync(getPath("promises/writeFile", "t4.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(`{--  "age": 456--}--`);
                });
                test("should test finalEOL options = false", async function () {
                    await expect(
                        json.promises.writeJsonFile(
                            getPath("promises/writeFile", "t5.json"),
                            { age: 456 },
                            { spaces: 2, EOL: "--", finalEOL: false }
                        )
                    ).to.not.be.eventually.rejected;
                    const content = fs.readFileSync(getPath("promises/writeFile", "t5.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(`{--  "age": 456--}`);
                });
            });
            describe("> ensureJsonFile", function () {
                test("should stringify and write json file", async function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("promises/ensureFile", [x, y, "t1.json"]);
                    const obj = { age: 456 };
                    await expect(json.promises.writeJsonFile(path, obj)).to.be.eventually.rejected;
                    await expect(json.promises.ensureJsonFile(path, obj)).to.not.eventually.be.rejected;
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(JSON.parse(content)).to.be.eql(obj);
                });
                test("should test replace and transform json string", async function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("promises/ensureFile", [x, y, "t2.json"]);
                    await expect(
                        json.promises.writeJsonFile(path, { day: new Date(), age: 456 }, { replacer: replacer })
                    ).to.be.eventually.rejected;
                    await expect(
                        json.promises.ensureJsonFile(path, { day: new Date(), age: 456 }, { replacer: replacer })
                    ).to.not.eventually.be.rejected;
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(JSON.parse(content))
                        .to.have.property("day")
                        .to.match(/date:.*/);
                });
                test("should write file with spaces", async function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("promises/ensureFile", [x, y, "t3.json"]);
                    await expect(json.promises.writeJsonFile(path, { age: 456 }, { spaces: 4 })).to.be.eventually
                        .rejected;
                    await expect(json.promises.ensureJsonFile(path, { age: 456 }, { spaces: 4 })).to.not.eventually.be
                        .rejected;
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                });
                test("should use EOL option", async function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("promises/ensureFile", [x, y, "t4.json"]);
                    await expect(json.promises.writeJsonFile(path, { age: 456 }, { spaces: 2, EOL: "--" })).to.be
                        .eventually.rejected;
                    await expect(json.promises.ensureJsonFile(path, { age: 456 }, { spaces: 2, EOL: "--" })).to.not
                        .eventually.be.rejected;
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(`{--  "age": 456--}--`);
                });
                test("should test finalEOL options = false", async function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("promises/ensureFile", [x, y, "t5.json"]);
                    await expect(
                        json.promises.writeJsonFile(path, { age: 456 }, { spaces: 2, EOL: "--", finalEOL: false })
                    ).to.be.eventually.rejected;
                    await expect(
                        json.promises.ensureJsonFile(path, { age: 456 }, { spaces: 2, EOL: "--", finalEOL: false })
                    ).to.not.eventually.be.rejected;
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(`{--  "age": 456--}`);
                });
            });
        });
        describe("> sync", function () {
            describe("> readJsonFile", function () {
                test("should read and parse JSON", function () {
                    const file = common.getPath("readFile/file.json");
                    expect(json.readJsonFileSync(file)).to.be.eql(readFileObj);
                });
                test("when throw option is false file is invalid", function () {
                    const file = common.getPath("readFile/invalid.json");
                    expect(() => json.readJsonFileSync(file, { throws: false })).to.not.throw();
                });
                test("when throw option is true (default) and file is invalid", function () {
                    const file = common.getPath("readFile/invalid.json");
                    expect(() => json.readJsonFileSync(file))
                        .to.throw()
                        .to.have.property("message")
                        .to.have.string(file);
                });
                test("when throw option is false and file is missing", function () {
                    const file = common.getPath("readFile/missing.json");
                    expect(() => json.readJsonFileSync(file, { throws: false })).to.not.throw();
                });
                test("when throw option is true (default)", function () {
                    const file = common.getPath("readFile/missing.json");
                    expect(() => json.readJsonFileSync(file))
                        .to.throw()
                        .to.have.property("message")
                        .to.have.string(file);
                });
                test("should test reviver and transform json object", function () {
                    const file = common.getPath("readFile/reviver.json");
                    const obj = json.readJsonFileSync(file, {
                        reviver: reviver,
                    });
                    expect(obj).to.have.property("day").to.be.instanceOf(Date).to.be.eql(day);
                });
                test("stripBom", function () {
                    const file = common.getPath("readFile/bom.json");
                    expect(json.readJsonFileSync(file)).to.be.eql(readFileObj);
                });
            });
            describe("> writeJsonFile", function () {
                test("should stringify and write json file", function () {
                    const obj = { age: 456 };
                    expect(() => json.writeJsonFileSync(getPath("sync/writeFile", "t1.json"), obj)).to.not.throw();
                    const content = fs.readFileSync(getPath("sync/writeFile", "t1.json"), { encoding: "utf-8" });
                    expect(JSON.parse(content)).to.be.eql(obj);
                });
                test("should test replace and transform json string", function () {
                    expect(() =>
                        json.writeJsonFileSync(
                            getPath("sync/writeFile", "t2.json"),
                            { day: new Date(), age: 456 },
                            { replacer: replacer }
                        )
                    ).to.not.throw();
                    const content = fs.readFileSync(getPath("sync/writeFile", "t2.json"), { encoding: "utf-8" });
                    expect(JSON.parse(content))
                        .to.have.property("day")
                        .to.match(/date:.*/);
                });
                test("should write file with spaces", function () {
                    expect(() =>
                        json.writeJsonFileSync(getPath("sync/writeFile", "t3.json"), { age: 456 }, { spaces: 4 })
                    ).to.not.throw();
                    const content = fs.readFileSync(getPath("sync/writeFile", "t3.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                });
                test("should use EOL option", function () {
                    expect(() =>
                        json.writeJsonFileSync(
                            getPath("sync/writeFile", "t4.json"),
                            { age: 456 },
                            { spaces: 2, EOL: "--" }
                        )
                    ).to.not.throw();
                    const content = fs.readFileSync(getPath("sync/writeFile", "t4.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(`{--  "age": 456--}--`);
                });
                test("should test finalEOL options = false", function () {
                    expect(() =>
                        json.writeJsonFileSync(
                            getPath("sync/writeFile", "t5.json"),
                            { age: 456 },
                            { spaces: 2, EOL: "--", finalEOL: false }
                        )
                    ).to.not.throw();
                    const content = fs.readFileSync(getPath("sync/writeFile", "t5.json"), { encoding: "utf-8" });
                    expect(content).to.be.equal(`{--  "age": 456--}`);
                });
            });
            describe("> ensureJsonFile", function () {
                test("should stringify and write json file", function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("sync/ensureFile", [x, y, "t1.json"]);
                    const obj = { age: 456 };
                    expect(() => json.writeJsonFileSync(path, obj)).to.throw();
                    expect(() => json.ensureJsonFileSync(path, obj)).to.not.throw();
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(JSON.parse(content)).to.be.eql(obj);
                });
                test("should test replace and transform json string", function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("sync/ensureFile", [x, y, "t2.json"]);
                    expect(() =>
                        json.writeJsonFileSync(path, { day: new Date(), age: 456 }, { replacer: replacer })
                    ).to.throw();
                    expect(() =>
                        json.ensureJsonFileSync(path, { day: new Date(), age: 456 }, { replacer: replacer })
                    ).to.not.throw();
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(JSON.parse(content))
                        .to.have.property("day")
                        .to.match(/date:.*/);
                });
                test("should write file with spaces", function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("sync/ensureFile", [x, y, "t3.json"]);
                    expect(() => json.writeJsonFileSync(path, { age: 456 }, { spaces: 4 })).to.throw();
                    expect(() => json.ensureJsonFileSync(path, { age: 456 }, { spaces: 4 })).to.not.throw();
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(JSON.stringify({ age: 456 }, null, 4) + "\n");
                });
                test("should use EOL option", function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("sync/ensureFile", [x, y, "t4.json"]);
                    expect(() => json.writeJsonFileSync(path, { age: 456 }, { spaces: 2, EOL: "--" })).to.throw();
                    expect(() => json.ensureJsonFileSync(path, { age: 456 }, { spaces: 2, EOL: "--" })).to.not.throw();
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(`{--  "age": 456--}--`);
                });
                test("should test finalEOL options = false", function () {
                    const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
                    const path = getPath("sync/ensureFile", [x, y, "t5.json"]);
                    expect(() =>
                        json.writeJsonFileSync(path, { age: 456 }, { spaces: 2, EOL: "--", finalEOL: false })
                    ).to.throw();
                    expect(() =>
                        json.ensureJsonFileSync(path, { age: 456 }, { spaces: 2, EOL: "--", finalEOL: false })
                    ).to.not.throw();
                    const content = fs.readFileSync(path, {
                        encoding: "utf-8",
                    });
                    expect(content).to.be.equal(`{--  "age": 456--}`);
                });
            });
        });
    });
});
