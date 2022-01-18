import { expect, use } from "chai";
import { describe, test, before, after } from "mocha";
import chaiAsPromised from "chai-as-promised";
use(chaiAsPromised);

import * as list from "../../src/list/index";
import * as size from "../../src/size/index";
import { Common, TestDirStructure } from "../Common";

const drive: TestDirStructure = {
    "file1.txt": "content 1",
    "file2.txt": "content 2",
    folder: {
        subfolder: {
            "file.txt": "file sub folder",
        },
    },
    folder2: {
        "file.txt": "file folder 2",
    },
};

const common = new Common("fs-extender-compare-size", drive);

describe("fs-extender", function () {
    describe("> size", function () {
        before(async () => common.beforeAll());
        after(async () => common.afterAll());
        describe("> async", function () {
            test("should return size stats", function (done) {
                const path = common.getPath("");
                const items = list.listSync(path);
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                size.size(path, (err: NodeJS.ErrnoException | null, stats: size.SizeStats) => {
                    expect(err).to.be.null;
                    Object.keys(sizeStats).forEach((key) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        expect(stats).to.have.property(key, (sizeStats as any)[key]);
                    });
                    done();
                });
            });
            test("should return size stats with depth = 0", function (done) {
                const path = common.getPath("");
                const items = list.listSync(path, { depth: 0 });
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                size.size(path, { depth: 0 }, (err: NodeJS.ErrnoException | null, stats: size.SizeStats) => {
                    expect(err).to.be.null;
                    Object.keys(sizeStats).forEach((key) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        expect(stats).to.have.property(key, (sizeStats as any)[key]);
                    });
                    done();
                });
            });
            test("should throw on invalid path", function (done) {
                size.size(common.getPath("invalid"), (err: NodeJS.ErrnoException | null) => {
                    expect(err).to.not.be.null;
                    done();
                });
            });
        });
        describe("> promises", function () {
            test("should return size stats", async function () {
                const path = common.getPath("");
                const items = list.listSync(path);
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                const stats = await size.promises.size(path);
                Object.keys(sizeStats).forEach((key) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    expect(stats).to.have.property(key, (sizeStats as any)[key]);
                });
            });
            test("should return size stats with depth = 0", async function () {
                const path = common.getPath("");
                const items = list.listSync(path, { depth: 0 });
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                const stats = await size.promises.size(path, { depth: 0 });
                Object.keys(sizeStats).forEach((key) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    expect(stats).to.have.property(key, (sizeStats as any)[key]);
                });
            });
            test("should throw on invalid path", async function () {
                await expect(size.promises.size(common.getPath("invalid"))).to.eventually.rejected.to.have.property(
                    "code",
                    "ENOENT"
                );
            });
        });
        describe("> sync", function () {
            test("should return size stats", function () {
                const path = common.getPath("");
                const items = list.listSync(path);
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                const stats = size.sizeSync(path);
                Object.keys(sizeStats).forEach((key) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    expect(stats).to.have.property(key, (sizeStats as any)[key]);
                });
            });
            test("should return size stats with depth = 0", function () {
                const path = common.getPath("");
                const items = list.listSync(path, { depth: 0 });
                const sizeStats = {
                    totalItems: items.length,
                    totalSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    files: items.reduce((p, c) => p + (c.stats.isFile() ? 1 : 0), 0),
                    filesSize: items.reduce((p, c) => p + (c.stats.isFile() ? c.stats.size : 0), 0),
                    directories: items.reduce((p, c) => p + (c.stats.isDirectory() ? 1 : 0), 0),
                    links: items.reduce((p, c) => p + (c.stats.isSymbolicLink() ? 1 : 0), 0),
                    blockDevices: items.reduce((p, c) => p + (c.stats.isBlockDevice() ? 1 : 0), 0),
                    fifos: items.reduce((p, c) => p + (c.stats.isFIFO() ? 1 : 0), 0),
                    sockets: items.reduce((p, c) => p + (c.stats.isSocket() ? 1 : 0), 0),
                    characterDevices: items.reduce((p, c) => p + (c.stats.isCharacterDevice() ? 1 : 0), 0),
                };
                const stats = size.sizeSync(path, { depth: 0 });
                Object.keys(sizeStats).forEach((key) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    expect(stats).to.have.property(key, (sizeStats as any)[key]);
                });
            });
            test("should throw on invalid path", function () {
                expect(() => size.sizeSync(common.getPath("invalid"))).to.throw();
            });
        });
    });
});
