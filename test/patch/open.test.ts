import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    "file.txt": "content",
    folder: {
        "file.txt": "content",
    },
};

const common = new Common("fs-extender-patch-open", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> open", function () {
            before(async () => common.beforeAll());
            after(async () => common.afterAll());
            describe("> async", function () {
                test("should open an existing file async", function (done) {
                    fs.open(common.getPath("file.txt"), "r", (err: NodeJS.ErrnoException | null, fd: number): void => {
                        expect(err).to.be.null;
                        expect(fd).to.exist;
                        fs.close(fd, (err: NodeJS.ErrnoException | null): void => {
                            expect(err).to.be.null;
                            done();
                        });
                    });
                });
                test("should fail to open non-existing file async", function (done) {
                    fs.open(
                        common.getPath("invalid/file/path/async"),
                        "r",
                        (err: NodeJS.ErrnoException | null, fd: number): void => {
                            expect(fd).to.be.undefined;
                            expect(err).to.exist;
                            expect((err as NodeJS.ErrnoException).code).equal("ENOENT");
                            done();
                        }
                    );
                });
            });
        });
    });
});
