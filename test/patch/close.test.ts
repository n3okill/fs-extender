import { expect } from "chai";
import { describe, test } from "mocha";

import * as fs from "../../src/patch/patch.js";

describe("fs-extender", function () {
    describe("> patch", function () {
        describe("> close", function () {
            test("fs close patched", function () {
                expect(fs.close.toString()).to.have.string("closeFsExtender");
            });
            test("fs closeSync patched", function () {
                expect(fs.closeSync.toString()).to.have.string("closeSyncFsExtender");
            });
        });
    });
});
