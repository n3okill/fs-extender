import { expect } from "chai";
import { describe, test, before, after } from "mocha";

import * as fs from "../../src/patch/patch";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = { "file.txt": "content" };

const common = new Common("fs-extender-patch-maxOpen", drive);

describe("fs-extender", function () {
    describe("> patch", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> max open", function () {
            //This test should be run with a specific script 'ulimit -n 50 && mocha' to define ulimit
            test("should test open a lot of stuff", function (done) {
                this.slow(5000);
                // Get around EBADF from libuv by making sure that stderr is opened
                // Otherwise Darwin will refuse to give us a FD for stderr!
                process.stderr.write("");
                const n = 100;
                let openOrders = 0;
                let openReality = 0;
                let going = true;
                let closed = 0;
                let closes = [];

                const fds: number[] = [];

                const openFile = function () {
                    openOrders++;
                    fs.open(common.getPath("file.txt"), "r", function (err, fd) {
                        openReality++;
                        expect(err).to.be.null;
                        fds.push(fd);
                        if (going) {
                            openFile();
                        }
                    });
                };
                for (let i = 0; i < n; i++) {
                    openFile();
                }

                // should hit ulimit pretty fast
                setTimeout(function () {
                    if (going) {
                        expect(fs.getQueue()).to.have.length.above(0);
                    }
                    going = false;
                    expect(openOrders - fds.length).to.equal(n);
                    stop();
                }, 100);

                const stop = function () {
                    if (closed === openOrders && closed === openReality && fds.length === 0 && closes.length === 0) {
                        expect(fs.getQueue()).to.have.length(0);
                        return done();
                    }

                    setTimeout(function () {
                        stop();
                    }, 100);

                    closes = fds.slice(0);
                    fds.length = 0;
                    while (closes.length > 0) {
                        fs.close(closes.pop() as number, (err) => {
                            if (err) {
                                throw err;
                            }
                            closed++;
                        });
                    }
                };
            });
        });
    });
});
