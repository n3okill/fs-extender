import { expect } from "chai";
import { describe, test, before } from "mocha";

import * as v8 from "v8";
import * as vm from "vm";
import { Type } from "@n3okill/utils";
import importFresh = require("import-fresh");

describe("fs-extender", () => {
    describe("> memory leak", () => {
        let previousHeapStats: NodeJS.MemoryUsage;
        function checkHeap() {
            const v8Stats = v8.getHeapStatistics();
            const stats = process.memoryUsage();
            if (Type.isNumber(v8Stats.number_of_detached_contexts)) {
                expect(v8Stats.number_of_detached_contexts).to.equal(0);
            } else {
                const memoryUsage = stats.heapUsed - previousHeapStats.heapUsed;
                const memoryUsageMB = Math.round(memoryUsage / Math.pow(1024, 2));
                expect(memoryUsageMB).to.be.lessThan(2);
            }
        }
        before(() => {
            v8.setFlagsFromString("--expose_gc");
        });
        test("no memory leak when loading fs-extender multiple times", function (done) {
            this.timeout(20000);
            this.slow(20000);
            importFresh("../../dist/cjs/index.js");
            previousHeapStats = process.memoryUsage();
            //simulate with 4000 tests
            let i = 0;
            function importFreshFsExtender() {
                importFresh("../../dist/cjs/index.js");
                if (i < 4000) {
                    i++;
                    process.nextTick(() => importFreshFsExtender());
                } else {
                    vm.runInNewContext("gc")();
                    checkHeap();
                    done();
                }
            }
            importFreshFsExtender();
        });
    });
});
