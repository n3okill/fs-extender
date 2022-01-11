import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as NodeCrypto from "crypto";
import { Type, BufferUtil } from "@n3okill/utils";
import { after, before, describe, test } from "mocha";
import NodePath from "path-extender";
import * as copy from "../../src/copy/index.js";
import * as fs from "../../src/patch/patch.js";
import { Readable } from "stream";
import { Common, TestDirStructure } from "../Common.js";
use(chaiAsPromised);

const SIZE = 16; //16 * 64 * 1024 + 7;
const FILES = 2;
const randomBytes = NodeCrypto.randomBytes(SIZE).toString();

const drive: TestDirStructure = {
    async: {
        TEST_enfscopy_src: randomBytes,
        "file.bin": "",
        "file.css": "",
        "file1.bin": "",
        "file.txt": "did it copy?\n",
        "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
        srca: {
            subdir: {},
        },
        data: {
            "f1.txt": "file1",
            "f2.txt": "file2",
        },
        identicalFile: "some data",
        identicalFile1: "some data",
        windowsInvalidCharSrc: {
            "file.txt": "",
        },
        srcPerm: {
            "f1.txt": "",
            someDir: {
                "f2.bin": "",
            },
            anotherDir: {},
        },
        timestamp: {
            "file1.txt": "",
        },
        toSelf: {
            src: {
                out: {},
                "file.txt": "",
            },
            src_out: {},
        },
        src: {
            default: {
                file: "contents",
                dirFile: "contents",
                dir: {},
            },
            deref: {
                file: "contents",
                dir: {
                    dirFile: "contents",
                },
            },
        },
        emptyDir: {
            txt: {
                "file.txt": "filetxt",
            },
            js: {
                "file.js": "filejs",
            },
        },
    },
    promises: {
        TEST_enfscopy_src: randomBytes,
        "file.bin": "",
        "file.css": "",
        "file1.bin": "",
        "file.txt": "did it copy?\n",
        "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
        srca: {
            subdir: {},
        },
        data: {
            "f1.txt": "file1",
            "f2.txt": "file2",
        },
        identicalFile: "some data",
        identicalFile1: "some data",
        windowsInvalidCharSrc: {
            "file.txt": "",
        },
        srcPerm: {
            "f1.txt": "",
            someDir: {
                "f2.bin": "",
            },
            anotherDir: {},
        },
        timestamp: {
            "file1.txt": "",
        },
        toSelf: {
            src: {
                out: {},
                "file.txt": "",
            },
            src_out: {},
        },
        src: {
            default: {
                file: "contents",
                dirFile: "contents",
                dir: {},
            },
            deref: {
                file: "contents",
                dir: {
                    dirFile: "contents",
                },
            },
        },
        emptyDir: {
            txt: {
                "file.txt": "filetxt",
            },
            js: {
                "file.js": "filejs",
            },
        },
    },
    sync: {
        TEST_enfscopy_src: randomBytes,
        "file.bin": "",
        "file.css": "",
        "file1.bin": "",
        "file.txt": "did it copy?\n",
        "special_‰øᵹ_chars.src": "content also as sepcial chars: ›øΩ",
        srca: {
            subdir: {},
        },
        data: {
            "f1.txt": "file1",
            "f2.txt": "file2",
        },
        identicalFile: "some data",
        identicalFile1: "some data",
        windowsInvalidCharSrc: {
            "file.txt": "",
        },
        srcPerm: {
            "f1.txt": "",
            someDir: {
                "f2.bin": "",
            },
            anotherDir: {},
        },
        timestamp: {
            "file1.txt": "",
        },
        toSelf: {
            src: {
                out: {},
                "file.txt": "",
            },
            src_out: {},
        },
        src: {
            default: {
                file: "contents",
                dirFile: "contents",
                dir: {},
            },
            deref: {
                file: "contents",
                dir: {
                    dirFile: "contents",
                },
            },
        },
        emptyDir: {
            txt: {
                "file.txt": "filetxt",
            },
            js: {
                "file.js": "filejs",
            },
        },
    },
};

Object.keys(drive).forEach((k) => {
    for (let i = 0; i < FILES; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (drive as any)[k].srca[`${i}.txt`] = randomBytes;
    }
    for (let i = 0; i < FILES; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (drive as any)[k].srca.subdir[`${i}.txt`] = randomBytes;
    }
});

const common = new Common("fs-extender-copy", drive);

function getPath(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPath([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPath(arg);
}

function getPathRelative(area: string, path: string | string[]): string {
    if (Type.isString(path)) {
        return common.getPathRelative([area, path as string]);
    }
    const arg = [area, ...(path as string[])];
    return common.getPathRelative(arg);
}

describe("fs-extender", function () {
    let cwd: string;
    // http://man7.org/linux/man-pages/man2/stat.2.html
    //const S_IFREG = 0o100000; //parseInt("0100000", 8);    //regular file
    //const S_IFDIR = 0o040000; //parseInt("0040000", 8);    //regular directory
    let ownerFile: number, ownerDir: number;

    // these are Mac specific I think (at least staff), should find Linux equivalent
    try {
        ownerFile = process.getgid(); // userid.gid('wheel')
    } catch (err) {
        ownerFile = 0;
    }
    try {
        ownerDir = process.getgid(); // userid.gid('staff')
    } catch (err) {
        ownerDir = 0;
    }

    function chmodFile(name: string, mode: number, owner: number) {
        fs.chmodSync(name, mode);
        fs.chownSync(name, process.getuid ? process.getuid() : 0, owner);
        const stat = fs.lstatSync(name);
        return stat;
    }

    function chmodDir(path: string, mode: number, owner: number) {
        fs.chmodSync(path, mode);
        fs.chownSync(path, process.getuid ? process.getuid() : 0, owner);
        const stat = fs.lstatSync(path);
        return stat;
    }
    before(async function () {
        await common.beforeAll();
        for (const key of Object.keys(drive)) {
            await fs.promises.utimes(
                getPath(key, "timestamp/file1.txt"),
                new Date(Date.now() - 200000),
                new Date(Date.now() - 200000)
            );
            if (common.canSymlinkTest) {
                await fs.promises.symlink(getPath(key, "toSelf/src"), getPath(key, "toSelf/src_symlink"), "dir");
                await fs.promises.symlink(getPath(key, "identicalFile"), getPath(key, "testLink"), "file");
                await fs.promises.symlink(getPath(key, "identicalFile1"), getPath(key, "testLink1"), "file");
                await fs.promises.symlink(
                    getPath(key, "src/default/file"),
                    getPath(key, "src/default/fileLink"),
                    "file"
                );
                await fs.promises.symlink(
                    getPath(key, "src/default/dir"),
                    getPath(key, "src/default/dirFileLink"),
                    "dir"
                );
                await fs.promises.symlink(getPath(key, "src/deref/file"), getPath(key, "src/deref/fileLink"), "file");
                await fs.promises.symlink(getPath(key, "src/deref/dir"), getPath(key, "src/deref/dirFileLink"), "dir");
            }
        }
        cwd = process.cwd();
        process.chdir(common.getPath(""));
    });
    after(async function () {
        process.chdir(cwd);
        return common.afterAll();
    });
    describe("> copy", function () {
        describe("> async", function () {
            describe.skip("> copy output object", function () {
                //to be done
            });
            describe("> when the source is a file", function () {
                test("should copy the file", function (done) {
                    const src = getPath("async", "TEST_enfscopy_src");
                    const dst = getPath("async", "TEST_enfscopy_dst");
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    copy.copy(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                        expect(srcMd5).to.be.equal(dstMd5);
                        done();
                    });
                });
                test("should copy the file with buffer path", function (done) {
                    const src = Buffer.from(getPath("async", "TEST_enfscopy_src"));
                    const dst = Buffer.from(getPath("async", "TEST_enfscopy_dst_buffer"));
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    copy.copy(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                        expect(srcMd5).to.be.equal(dstMd5);
                        done();
                    });
                });
                test("should copy the file with stream info", function (done) {
                    const src = getPath("async", "TEST_enfscopy_src");
                    const dst = getPath("async", "TEST_enfscopy_dst_stream");
                    let count = 0;
                    let fileToCopy: fs.PathLike = "";
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    stream.on("data", (chunk: string) => {
                        const obj: copy.CopyStreamOutType = JSON.parse(chunk);
                        if (obj.type.toLowerCase() === "file") {
                            count++;
                        }
                        fileToCopy = obj.item;
                    });
                    copy.copy(src, dst, { stream: stream }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                        expect(srcMd5).to.be.equal(dstMd5);
                        expect(count).to.be.equal(1);
                        expect(fileToCopy).to.be.equal(src);
                        done();
                    });
                });
                test("should return an error if the source file does not exist", function (done) {
                    copy.copy(
                        getPath("async", "file-dont-exist"),
                        getPath("async", "TEST_enfscopy_dst"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                            expect((err as NodeJS.ErrnoException).message).to.match(
                                /no such file or directory, lstat '.*'/
                            );
                            done();
                        }
                    );
                });
                test("should return an error if the source file does not exist with buffer path", function (done) {
                    copy.copy(
                        Buffer.from(getPath("async", "file-dont-exist")),
                        getPath("async", "TEST_enfscopy_dst"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("ENOENT");
                            expect((err as NodeJS.ErrnoException).message).to.match(
                                /no such file or directory, lstat '.*'/
                            );
                            done();
                        }
                    );
                });
                test("should only copy files allowed by filter regex", function (done) {
                    copy.copy(
                        getPath("async", "file.bin"),
                        getPath("async", "dstfile.html"),
                        /.html$|.css$/i,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            fs.stat(getPath("async", "dstfile.html"), (errStat: NodeJS.ErrnoException | null) => {
                                expect((errStat as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                                done();
                            });
                        }
                    );
                });
                test("should only copy files allowed by filter regex with buffer path", function (done) {
                    copy.copy(
                        Buffer.from(getPath("async", "file.bin")),
                        getPath("async", "dstfile_buffer.html"),
                        /.html$|.css$/i,
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            fs.stat(getPath("async", "dstfile.html"), (errStat: NodeJS.ErrnoException | null) => {
                                expect((errStat as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                                done();
                            });
                        }
                    );
                });
                test("should only copy files allowed by filter function", function (done) {
                    copy.copy(
                        getPath("async", "file.css"),
                        getPath("async", "dstFile.css"),
                        (path) => path.split(".").pop() !== "css",
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            fs.stat(getPath("async", "dstFile.css"), (errStat: NodeJS.ErrnoException | null) => {
                                expect((errStat as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                                done();
                            });
                        }
                    );
                });
                test("should only copy files allowed by filter function with buffer path", function (done) {
                    copy.copy(
                        Buffer.from(getPath("async", "file.css")),
                        getPath("async", "dstFile_buffer.css"),
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        (path) => !BufferUtil.split(path, ".").pop()!.equals(Buffer.from("css")),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            fs.stat(getPath("async", "dstFile_buffer.css"), (errStat: NodeJS.ErrnoException | null) => {
                                expect((errStat as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                                done();
                            });
                        }
                    );
                });
                test("accepts options object in place of filter", function (done) {
                    copy.copy(
                        getPath("async", "file1.bin"),
                        getPath("async", "dstFile.bin"),
                        { filter: /.html$|.css$/ },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            fs.stat(getPath("async", "dstFile.bin"), (errStat: NodeJS.ErrnoException | null) => {
                                expect((errStat as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                                done();
                            });
                        }
                    );
                });
                test("when the destination dir does not exist", function (done) {
                    const dst = getPath("async", "this/path/does/not/exist/copied.txt");
                    copy.copy(getPath("async", "file.txt"), dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal("did it copy?\n");
                        done();
                    });
                });
                test("copies directory 'src' to 'src_out/src'", function (done) {
                    copy.copy(
                        getPath("async", "windowsInvalidCharSrc/file.txt"),
                        getPath("async", "windowsInvalidCharOut:/file.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            if (common.IsWindows) {
                                expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                            } else {
                                expect(err).to.be.null;
                            }
                            done();
                        }
                    );
                });
                test("copy file with special characters", function (done) {
                    const src = getPath("async", "special_‰øᵹ_chars.src");
                    const dst = getPath("async", "special_‰øᵹ_chars.dst");
                    copy.copy(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        const exist = fs.existsSync(dst);
                        expect(exist).to.be.true;
                        fs.readFile(src, "utf-8", (errReadSrc: NodeJS.ErrnoException | null, contentSrc) => {
                            fs.readFile(dst, "utf-8", (errReadDst: NodeJS.ErrnoException | null, contentDst) => {
                                expect(contentSrc).to.be.equal(contentDst);
                                expect(contentDst).to.be.equal("content also as sepcial chars: ›øΩ");
                                done();
                            });
                        });
                    });
                });
            });
            describe("> when the source is a directory", function () {
                test("when the source directory does not exist should return an error", function (done) {
                    copy.copy(
                        getPath("async", "this_dir_does_not_exist"),
                        getPath("async", "this_dir_really_does_not_matter"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                            done();
                        }
                    );
                });
                test("should copy the directory", function (done) {
                    copy.copy(
                        getPath("async", "srca"),
                        getPath("async", "dsta"),
                        (err: NodeJS.ErrnoException | null, stats) => {
                            expect(err).to.be.null;
                            expect(fs.statSync(getPath("async", "dsta")).isDirectory()).to.be.true;
                            let copiedSize = 0;
                            for (let i = 0; i < FILES; i++) {
                                const statFile = fs.statSync(getPath("async", ["dsta", i.toString() + ".txt"]));
                                expect(statFile.isFile()).to.be.true;
                                copiedSize += statFile.size;
                            }
                            expect(fs.statSync(getPath("async", ["dsta", "subdir"])).isDirectory()).to.be.true;
                            for (let i = 0; i < FILES; i++) {
                                const statFile = fs.statSync(
                                    getPath("async", ["dsta", "subdir", i.toString() + ".txt"])
                                );
                                expect(statFile.isFile()).to.be.true;
                                copiedSize += statFile.size;
                            }
                            expect(copiedSize).to.be.equal(stats.copied.size);
                            done();
                        }
                    );
                });
                test("when the destination directory does not exist", function (done) {
                    const src = getPath("async", "data");
                    const dst = getPath("async", ["this", "path", "does", "not", "exist"]);
                    copy.copy(src, dst, () => {
                        expect(fs.readFileSync(NodePath.join(dst, "f1.txt"), "utf-8")).to.be.equal("file1");
                        expect(fs.readFileSync(NodePath.join(dst, "f2.txt"), "utf-8")).to.be.equal("file2");
                        done();
                    });
                });
                test("when the destination directory does not exist with buffer path", function (done) {
                    const src = Buffer.from(getPath("async", "data"));
                    const dst = getPath("async", ["buffer", "this", "path", "does", "not", "exist"]);
                    copy.copy(src, dst, () => {
                        expect(fs.readFileSync(NodePath.join(dst, "f1.txt"), "utf-8")).to.be.equal("file1");
                        expect(fs.readFileSync(NodePath.join(dst, "f2.txt"), "utf-8")).to.be.equal("file2");
                        done();
                    });
                });
                test("when src directory does not exist should return an error", function (done) {
                    copy.copy(
                        getPath("async", "/path/does/not/exist"),
                        getPath("async", "/to/any/place"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                            done();
                        }
                    );
                });
                test("ignoreEmptyFolders option", function (done) {
                    const src = getPath("async", "emptyDir");
                    const dst = getPath("async", "emptyDirDst");
                    copy.copy(
                        src,
                        dst,
                        { ignoreEmptyFolders: true, filter: /.txt$/i },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            expect(fs.existsSync(getPath("async", ["emptyDirDst", "txt"]))).to.be.true;
                            expect(fs.existsSync(getPath("async", ["emptyDirDst", "js"]))).to.be.false;
                            done();
                        }
                    );
                });
            });
            describe("> when the src and dst are identical", function () {
                const fileData = "some data";
                test("when the src and dst are the same file should do nothing", function (done) {
                    const file = getPath("async", "identicalFile");
                    copy.copy(file, file, (err: NodeJS.ErrnoException | null) => {
                        expect((err as NodeJS.ErrnoException).code).to.be.equal("EINVAL");
                        expect((err as NodeJS.ErrnoException).message).to.match(
                            /Source and destination must not be the same./
                        );
                        done();
                    });
                });
                test("> when the src is symlink and points to dst should not copy and keep the symlink", function (done) {
                    if (!common.canSymlinkTest) {
                        return done();
                    }
                    const src = getPath("async", "testLink");
                    const dst = getPath("async", "identicalFile");
                    copy.copy(src, dst, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal(fileData);
                        //used replace because of tests in windows
                        expect(fs.readlinkSync(src)).to.be.equal(dst);
                        done();
                    });
                });
                test("> when dst is symlink and points to src should not copy and keep the symlink", function (done) {
                    if (!common.canSymlinkTest) {
                        this.skip();
                        done();
                    } else {
                        const src = getPath("async", "identicalFile1");
                        const dst = getPath("async", "testLink1");
                        copy.copy(src, dst, (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EEXIST");
                            done();
                        });
                    }
                });
            });
            describe("> when using dereference", function () {
                before(function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    }
                });
                test("copies symlinks by default", function (done) {
                    copy.copy(
                        getPathRelative("async", "./src/default"),
                        getPathRelative("async", "./dst/default"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            expect(fs.readlinkSync(getPathRelative("async", "./dst/default/fileLink"))).to.be.equal(
                                getPath("async", "./src/default/file")
                            );
                            expect(fs.readlinkSync(getPathRelative("async", "./dst/default/dirFileLink"))).to.be.equal(
                                getPath("async", "src/default/dir")
                            );
                            done();
                        }
                    );
                });
                test("copies file contents when dereference=true", function (done) {
                    const dst = getPathRelative("async", ["dst", "deref"]);
                    copy.copy(
                        getPathRelative("async", ["src", "deref"]),
                        dst,
                        { dereference: true },
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            const fileSymLink = NodePath.join(dst, "fileLink");
                            const dirSymLink = NodePath.join(dst, "dirFileLink");
                            expect(fs.statSync(fileSymLink).isFile()).to.be.true;
                            expect(fs.readFileSync(fileSymLink, "utf-8")).to.be.equal("contents");
                            expect(fs.statSync(dirSymLink).isDirectory()).to.be.true;
                            expect(fs.readdirSync(dirSymLink) as Array<unknown>).to.be.eql(["dirFile"]);
                            done();
                        }
                    );
                });
            });
            describe("> /dev/null", function () {
                test("should not return error", function (done) {
                    copy.copy("/dev/null", getPath("async", "devnull"), (err: NodeJS.ErrnoException | null) => {
                        if (common.IsWindows) {
                            expect(err).to.not.be.null;
                            expect(err).to.have.property("code", "ENOENT");
                            return done();
                        }
                        expect(err).to.be.null;
                        expect(fs.statSync(getPath("async", "devnull")).size).to.be.equal(0);
                        done();
                    });
                });
            });
            describe("> permissions", function () {
                test("should maintain file permissions and ownership", function (done) {
                    const statF1 = chmodFile(getPath("async", "./srcPerm/f1.txt"), 0o666, ownerFile);
                    const statD1 = chmodDir(getPath("async", "./srcPerm/someDir"), 0o766, ownerDir);
                    const statF2 = chmodFile(getPath("async", "./srcPerm/someDir/f2.bin"), 0o777, ownerFile);
                    const statD2 = chmodDir(getPath("async", "./srcPerm/anotherDir"), 0o444, ownerDir);
                    copy.copy(
                        getPath("async", "srcPerm"),
                        getPath("async", "dstPerm"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            const newF1 = getPath("async", "./dstPerm/f1.txt");
                            const newD1 = getPath("async", "./dstPerm/someDir");
                            const newF2 = getPath("async", "./dstPerm/someDir/f2.bin");
                            const newD2 = getPath("async", "./dstPerm/anotherDir");
                            const statNewF1 = fs.lstatSync(newF1);
                            expect(statNewF1.mode).to.be.equal(statF1.mode);
                            expect(statNewF1.gid).to.be.equal(statF1.gid);
                            expect(statNewF1.uid).to.be.equal(statF1.uid);
                            const statNewD1 = fs.lstatSync(newD1);
                            expect(statNewD1.mode).to.be.equal(statD1.mode);
                            expect(statNewD1.gid).to.be.equal(statD1.gid);
                            expect(statNewD1.uid).to.be.equal(statD1.uid);
                            const statNewF2 = fs.lstatSync(newF2);
                            expect(statNewF2.mode).to.be.equal(statF2.mode);
                            expect(statNewF2.gid).to.be.equal(statF2.gid);
                            expect(statNewF2.uid).to.be.equal(statF2.uid);
                            const statNewD2 = fs.lstatSync(newD2);
                            expect(statNewD2.mode).to.be.equal(statD2.mode);
                            expect(statNewD2.gid).to.be.equal(statD2.gid);
                            expect(statNewD2.uid).to.be.equal(statD2.uid);
                            done();
                        }
                    );
                });
            });
            describe("> preserve timestamps option", function () {
                test("should have the same timestamps on copy", function (done) {
                    const src = getPath("async", "./timestamp");
                    const dst = getPath("async", "./timestampOn");
                    copy.copy(src, dst, { preserveTimestamps: true }, (err: NodeJS.ErrnoException | null) => {
                        expect(err).to.be.null;
                        fs.stat(
                            getPath("async", "./timestamp/file1.txt"),
                            (errStat: NodeJS.ErrnoException | null, statSrc) => {
                                expect(errStat).to.be.null;
                                fs.stat(
                                    getPath("async", "./timestampOn/file1.txt"),
                                    (errStatDst: NodeJS.ErrnoException | null, statDst) => {
                                        expect(errStatDst).to.be.null;
                                        expect(statSrc.atime).to.be.eql(statDst.atime);
                                        expect(statSrc.mtime).to.be.eql(statDst.mtime);
                                        done();
                                    }
                                );
                            }
                        );
                    });
                });
            });
            describe("> copy to self", function () {
                test("returns an error when user copies parent to itself", function (done) {
                    copy.copy(
                        getPath("async", "./toSelf/src"),
                        getPath("async", "./toSelf/src/out"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EINVAL");
                            done();
                        }
                    );
                });
                test("copies 'src' to 'src' itself throw error", function (done) {
                    copy.copy(
                        getPath("async", "./toSelf/src"),
                        getPath("async", "./toSelf/src"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EINVAL");
                            done();
                        }
                    );
                });
                test("copies 'src to 'src_out'", function (done) {
                    copy.copy(
                        getPath("async", "./toSelf/src"),
                        getPath("async", "./toSelf/srcOut"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect(err).to.be.null;
                            done();
                        }
                    );
                });
                test("copies 'src' to 'src_symlink'", function (done) {
                    if (!common.canSymlinkTest) {
                        this.skip();
                        done();
                    } else {
                        copy.copy(
                            getPath("async", "./toSelf/src"),
                            getPath("async", "./toSelf/src_symlink"),
                            (err: NodeJS.ErrnoException | null) => {
                                expect((err as NodeJS.ErrnoException).code).to.be.equal("EISDIR");
                                done();
                            }
                        );
                    }
                });
                test("copies file 'src/file.txt' to file 'src/file.txt' throw error", function (done) {
                    copy.copy(
                        getPath("async", "./toSelf/src/file.txt"),
                        getPath("async", "./toSelf/src/file.txt"),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.be.equal("EINVAL");
                            done();
                        }
                    );
                });
                test("copies directory 'src' to 'src/src_out' throw error", function (done) {
                    copy.copy(
                        getPath("async", "./toSelf/src"),
                        getPath("async", "./toSelf/src" + getPath("async", "./toSelf/src/out")),
                        (err: NodeJS.ErrnoException | null) => {
                            expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                            done();
                        }
                    );
                });
            });
        });
        describe("> promises", function () {
            describe.skip("> copy output object", function () {
                //to be done
            });
            describe("> when the source is a file", function () {
                test("should copy the file", async function () {
                    const src = getPath("promises", "TEST_enfscopy_src");
                    const dst = getPath("promises", "TEST_enfscopy_dst");
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    await copy.promises.copy(src, dst);
                    const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                    expect(srcMd5).to.be.equal(dstMd5);
                });
                test("should copy the file with buffer path", async function () {
                    const src = getPath("promises", "TEST_enfscopy_src");
                    const dst = Buffer.from(getPath("promises", "TEST_enfscopy_dst_buffer"));
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    await copy.promises.copy(src, dst);
                    const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                    expect(srcMd5).to.be.equal(dstMd5);
                });
                test("should copy the file with stream info", async function () {
                    const src = getPath("promises", "TEST_enfscopy_src");
                    const dst = getPath("promises", "TEST_enfscopy_dst_stream");
                    let count = 0;
                    let fileToCopy: fs.PathLike = "";
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    const stream = new Readable({
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        read() {},
                        encoding: "utf-8",
                    });
                    stream.on("data", (chunk: string) => {
                        const obj: copy.CopyStreamOutType = JSON.parse(chunk);
                        if (obj.type.toLowerCase() === "file") {
                            count++;
                        }
                        fileToCopy = obj.item;
                    });
                    await copy.promises.copy(src, dst, { stream: stream });
                    const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                    expect(srcMd5).to.be.equal(dstMd5);
                    expect(count).to.be.equal(1);
                    expect(fileToCopy).to.be.equal(src);
                });
                test("should return an error if the source file does not exist", async function () {
                    const err = await expect(
                        copy.promises.copy("file-dont-exist", getPath("promises", "TEST_enfscopy_dst"))
                    ).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter regex", async function () {
                    await copy.promises.copy(
                        getPath("promises", "file.bin"),
                        getPath("promises", "dstfile.html"),
                        /.html$|.css$/i
                    );
                    const err = await expect(fs.promises.stat(getPath("promises", "dstfile.html"))).to.eventually
                        .rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter function", async function () {
                    await copy.promises.copy(
                        getPath("promises", "file.css"),
                        getPath("promises", "dstFile.css"),
                        (path) => path.split(".").pop() !== "css"
                    );
                    const err = await expect(fs.promises.stat(getPath("promises", "dstFile.css"))).to.eventually
                        .rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("accepts options object in place of filter", async function () {
                    await copy.promises.copy(getPath("promises", "file1.bin"), getPath("promises", "dstFile.bin"), {
                        filter: /.html$|.css$/,
                    });
                    const err = await expect(fs.promises.stat(getPath("promises", "dstFile.bin"))).to.eventually
                        .rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("when the destination dir does not exist", async function () {
                    const dst = getPath("promises", ["this", "path", "does", "not", "exist", "copied.txt"]);
                    await copy.promises.copy(getPath("promises", "file.txt"), dst);
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("did it copy?\n");
                });
                test("copies directory 'src' to 'src_out/src'", async function () {
                    expect(
                        copy.promises.copy(
                            getPath("promises", ["windowsInvalidCharSrc", "file.txt"]),
                            getPath("promises", ["windowsInvalidCharOut:", "file.txt"])
                        )
                    ).not.to.eventually.rejected;
                });
                test("copy file with special characters", async function () {
                    const src = getPath("promises", "special_‰øᵹ_chars.src");
                    const dst = getPath("promises", "special_‰øᵹ_chars.dst");
                    await copy.promises.copy(src, dst);
                    const exist = fs.existsSync(dst);
                    expect(exist).to.be.true;
                    const contentSrc = await fs.promises.readFile(src, "utf-8");
                    const contentDst = await fs.promises.readFile(dst, "utf-8");
                    expect(contentSrc).to.be.equal(contentDst);
                    expect(contentDst).to.be.equal("content also as sepcial chars: ›øΩ");
                });
            });
            describe("> when the source is a directory", function () {
                test("when the source directory does not exist should return an error", async function () {
                    const err = await expect(
                        copy.promises.copy(
                            getPath("promises", "this_dir_does_not_exist"),
                            getPath("promises", "this_dir_really_does_not_matter")
                        )
                    ).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("should copy the directory", async function () {
                    const stats = await copy.promises.copy(getPath("promises", "srca"), getPath("promises", "dsta"));
                    expect(fs.statSync(getPath("promises", "dsta")).isDirectory()).to.be.true;
                    let copiedSize = 0;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("promises", ["dsta", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(fs.statSync(getPath("promises", ["dsta", "subdir"])).isDirectory()).to.be.true;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("promises", ["dsta", "subdir", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(copiedSize).to.be.equal(stats.copied.size);
                });
                test("when the destination directory does not exist", async function () {
                    const src = getPath("promises", "data");
                    const dst = getPath("promises", ["this", "path", "does", "not", "exist"]);
                    await copy.promises.copy(src, dst);
                    expect(fs.readFileSync(NodePath.join(dst, "f1.txt"), "utf-8")).to.be.equal("file1");
                    expect(fs.readFileSync(NodePath.join(dst, "f2.txt"), "utf-8")).to.be.equal("file2");
                });
                test("> when src directory does not exist should return an error", async function () {
                    const err = await expect(copy.promises.copy("/path/does/not/exist", "/to/any/place")).to.eventually
                        .rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                });
                test("ignoreEmptyFolders option", async function () {
                    const src = getPath("promises", "emptyDir");
                    const dst = getPath("promises", "emptyDirDst");
                    await copy.promises.copy(src, dst, { ignoreEmptyFolders: true, filter: /.txt$/i });
                    expect(fs.existsSync(getPath("promises", ["emptyDirDst", "txt"]))).to.be.true;
                    expect(fs.existsSync(getPath("promises", ["emptyDirDst", "js"]))).to.be.false;
                });
            });
            describe("> when the src and dst are identical", function () {
                const fileData = "some data";
                test("when the src and dst are the same file should throw error", async function () {
                    const file = getPath("promises", "identicalFile");
                    const err: NodeJS.ErrnoException = await expect(copy.promises.copy(file, file)).to.eventually
                        .rejected;
                    expect(err.code).to.be.equal("EINVAL");
                    expect(err.message).to.match(/Source and destination must not be the same./);
                });
                test("when the src is symlink and points to dst should not copy and keep symlink", async function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    } else {
                        const src = getPath("promises", "testLink");
                        const dst = getPath("promises", "identicalFile");
                        await copy.promises.copy(src, dst);
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal(fileData);
                        expect(fs.readlinkSync(src)).to.be.equal(dst);
                    }
                });
                test("when dst is symlink and points to src should not copy and keep symlink", async function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    } else {
                        const src = getPath("promises", "identicalFile1");
                        const dst = getPath("promises", "testLink1");
                        const err: NodeJS.ErrnoException = await expect(copy.promises.copy(src, dst)).to.eventually
                            .rejected;
                        expect(err.code).to.be.equal("EEXIST");
                    }
                });
            });
            describe("> when using dereference", function () {
                before(function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    }
                });
                test("copies symlinks by default", async function () {
                    await copy.promises.copy(
                        getPath("promises", "./src/default"),
                        getPath("promises", "./dst/default")
                    );
                    expect(fs.readlinkSync(getPath("promises", "./dst/default/fileLink"))).to.be.equal(
                        getPath("promises", "./src/default/file")
                    );
                    expect(fs.readlinkSync(getPath("promises", "./dst/default/dirFileLink"))).to.be.equal(
                        getPath("promises", "./src/default/dir")
                    );
                });
                test("copies file contents when dereference=true", async function () {
                    const dst = getPath("promises", "./dst/deref");
                    await copy.promises.copy(getPath("promises", "./src/deref"), dst, { dereference: true });
                    const fileSymLink = NodePath.join(dst, "fileLink");
                    const dirSymLink = NodePath.join(dst, "dirFileLink");
                    expect(fs.statSync(fileSymLink).isFile()).to.be.true;
                    expect(fs.readFileSync(fileSymLink, "utf-8")).to.be.equal("contents");
                    expect(fs.statSync(dirSymLink).isDirectory()).to.be.true;
                    expect(fs.readdirSync(dirSymLink) as Array<unknown>).to.be.eql(["dirFile"]);
                });
            });
            describe("> /dev/null", function () {
                test("should not return an error", async function () {
                    if (common.IsWindows) {
                        const err = await expect(copy.promises.copy("/dev/null", getPath("promises", "devnull"))).to
                            .eventually.rejected;
                        expect(err).to.have.property("code", "ENOENT");
                    } else {
                        await expect(copy.promises.copy("/dev/null", getPath("promises", "devnull"))).fulfilled;
                        expect(fs.statSync(getPath("promises", "devnull")).size).to.be.equal(0);
                    }
                });
            });
            describe("> permissions", function () {
                test("should maintain file permissions and ownership", async function () {
                    const statF1 = chmodFile(getPath("promises", "./srcPerm/f1.txt"), 0o666, ownerFile);
                    const statD1 = chmodDir(getPath("promises", "./srcPerm/someDir"), 0o766, ownerDir);
                    const statF2 = chmodFile(getPath("promises", "./srcPerm/someDir/f2.bin"), 0o777, ownerFile);
                    const statD2 = chmodDir(getPath("promises", "./srcPerm/anotherDir"), 0o444, ownerDir);
                    await copy.promises.copy(getPath("promises", "srcPerm"), getPath("promises", "dstPerm"));
                    const newF1 = getPath("promises", "./dstPerm/f1.txt");
                    const newD1 = getPath("promises", "./dstPerm/someDir");
                    const newF2 = getPath("promises", "./dstPerm/someDir/f2.bin");
                    const newD2 = getPath("promises", "./dstPerm/anotherDir");
                    const statNewF1 = fs.lstatSync(newF1);
                    expect(statNewF1.mode).to.be.equal(statF1.mode);
                    expect(statNewF1.gid).to.be.equal(statF1.gid);
                    expect(statNewF1.uid).to.be.equal(statF1.uid);
                    const statNewD1 = fs.lstatSync(newD1);
                    expect(statNewD1.mode).to.be.equal(statD1.mode);
                    expect(statNewD1.gid).to.be.equal(statD1.gid);
                    expect(statNewD1.uid).to.be.equal(statD1.uid);
                    const statNewF2 = fs.lstatSync(newF2);
                    expect(statNewF2.mode).to.be.equal(statF2.mode);
                    expect(statNewF2.gid).to.be.equal(statF2.gid);
                    expect(statNewF2.uid).to.be.equal(statF2.uid);
                    const statNewD2 = fs.lstatSync(newD2);
                    expect(statNewD2.mode).to.be.equal(statD2.mode);
                    expect(statNewD2.gid).to.be.equal(statD2.gid);
                    expect(statNewD2.uid).to.be.equal(statD2.uid);
                });
            });
            describe("> preserve timestamps option", function () {
                test("should have the same timestamps on copy", async function () {
                    const src = getPath("promises", "timestamp");
                    const dst = getPath("promises", "timestampOn");
                    await copy.promises.copy(src, dst, {
                        preserveTimestamps: true,
                    });
                    const statSrc = await fs.promises.stat(getPath("promises", "./timestamp/file1.txt"));
                    const statDst = await fs.promises.stat(getPath("promises", "./timestampOn/file1.txt"));
                    expect(statSrc.atime).to.be.eql(statDst.atime);
                    expect(statSrc.mtime).to.be.eql(statDst.mtime);
                });
            });
            describe("> copy to self", function () {
                test("returns an error when user copies parent to itself", async function () {
                    const err = await expect(
                        copy.promises.copy(getPath("promises", "./toSelf/src"), getPath("promises", "./toSelf/src/out"))
                    ).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                });
                test("copies 'src' to 'src' itself don't throw error", async function () {
                    const err = await expect(
                        copy.promises.copy(getPath("promises", "./toSelf/src"), getPath("promises", "./toSelf/src"))
                    ).to.eventually.rejected;
                    expect((err as NodeJS.ErrnoException).code).to.match(/EINVAL/);
                });
                test("copies 'src to 'src_out'", async function () {
                    expect(
                        copy.promises.copy(getPath("promises", "./toSelf/src"), getPath("promises", "./toSelf/srcOut"))
                    ).not.to.eventually.rejected;
                });
                test("copies 'src' to 'src_symlink'", async function () {
                    if (common.canSymlinkTest) {
                        const err: NodeJS.ErrnoException = await expect(
                            copy.promises.copy(
                                getPath("promises", "./toSelf/src"),
                                getPath("promises", "./toSelf/src_symlink")
                            )
                        ).to.eventually.rejected;
                        expect(err.code).to.be.equal("EISDIR");
                    }
                });
                test("copies file 'src/file.txt' to file 'src/file.txt' don't throw error", async function () {
                    const err: NodeJS.ErrnoException = await expect(
                        copy.promises.copy(
                            getPath("promises", "./toSelf/src/file.txt"),
                            getPath("promises", "./toSelf/src/file.txt")
                        )
                    ).to.eventually.rejected;
                    expect(err.code).to.be.equal("EINVAL");
                });
                test("copies directory 'src' to 'src/src_out'", async function () {
                    const err: NodeJS.ErrnoException = await expect(
                        copy.promises.copy(
                            getPath("promises", "./toSelf/src"),
                            getPath("promises", "./toSelf/src" + getPath("promises", "./toSelf/src/out"))
                        )
                    ).to.eventually.rejected;
                    expect(err.code).to.match(/EINVAL/);
                });
            });
        });
        describe("sync", function () {
            describe("> when the source is a file", function () {
                test("should copy the file", function () {
                    const src = getPath("sync", "./TEST_enfscopy_src");
                    const dst = getPath("sync", "./TEST_enfscopy_dst");
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    expect(() => copy.copySync(src, dst)).not.to.throw();
                    const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                    expect(srcMd5).to.be.equal(dstMd5);
                });
                test("should copy the file with buffer path", function () {
                    const src = Buffer.from(getPath("sync", "./TEST_enfscopy_src"));
                    const dst = getPath("sync", "./TEST_enfscopy_dst_buffer");
                    const srcMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(src)).digest("hex");
                    expect(() => copy.copySync(src, dst)).not.to.throw();
                    const dstMd5 = NodeCrypto.createHash("md5").update(fs.readFileSync(dst)).digest("hex");
                    expect(srcMd5).to.be.equal(dstMd5);
                });
                test("should return an error if the source file does not exist", function () {
                    expect(() => copy.copySync("file-dont-exist", getPath("sync", "TEST_enfscopy_dst")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("should return an error if the source file does not exist with buffer path", function () {
                    expect(() => copy.copySync(Buffer.from("file-dont-exist"), getPath("sync", "TEST_enfscopy_dst")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter regex", function () {
                    copy.copySync(getPath("sync", "file.bin"), getPath("sync", "dstfile.html"), /.html$|.css$/i);
                    expect(() => fs.statSync(getPath("sync", "dstfile.html")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter regex with buffer path", function () {
                    copy.copySync(
                        Buffer.from(getPath("sync", "file.bin")),
                        getPath("sync", "dstfile_buffer.html"),
                        /.html$|.css$/i
                    );
                    expect(() => fs.statSync(getPath("sync", "dstfile.html")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter function", function () {
                    copy.copySync(
                        getPath("sync", "file.css"),
                        getPath("sync", "dstFile.css"),
                        (path) => path.split(".").pop() !== "css"
                    );
                    expect(() => fs.statSync(getPath("sync", "dstFile.css")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("should only copy files allowed by filter function with buffer path", function () {
                    copy.copySync(
                        Buffer.from(getPath("sync", "file.css")),
                        getPath("sync", "dstFile.css"),
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        (path) => !BufferUtil.split(path, ".").pop()!.equals(Buffer.from("css"))
                    );
                    expect(() => fs.statSync(getPath("sync", "dstFile.css")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("accepts options object in place of filter", function () {
                    copy.copySync(getPath("sync", "file1.bin"), getPath("sync", "dstFile.bin"), {
                        filter: /.html$|.css$/,
                    });
                    expect(() => fs.statSync(getPath("sync", "dstFile.bin")))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("when the destination dir does not exist", function () {
                    const dst = getPath("sync", ["this", "path", "does", "not", "exist", "copied.txt"]);
                    copy.copySync(getPath("sync", "file.txt"), dst);
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("did it copy?\n");
                });
                test("when the destination dir does not exist with buffer path", function () {
                    const dst = Buffer.from(
                        getPath("sync", ["buffer", "this", "path", "does", "not", "exist", "copied.txt"])
                    );
                    copy.copySync(getPath("sync", "file.txt"), dst);
                    expect(fs.readFileSync(dst, "utf-8")).to.be.equal("did it copy?\n");
                });
                test("copies directory 'src' to 'src_out/src'", function () {
                    try {
                        copy.copySync(
                            getPath("sync", ["windowsInvalidCharSrc", "file.txt"]),
                            getPath("sync", ["windowsInvalidCharOut:", "file.txt"])
                        );
                    } catch (err) {
                        expect((err as NodeJS.ErrnoException).message).to.match(/Invalid character found in path./);
                    }
                });
                test("copy file with special characters", function () {
                    const src = getPath("sync", "special_‰øᵹ_chars.src");
                    const dst = getPath("sync", "special_‰øᵹ_chars.dst");
                    copy.copySync(src, dst);
                    expect(fs.existsSync(dst)).to.be.true;
                    const contentSrc = fs.readFileSync(src, "utf-8");
                    const contentDst = fs.readFileSync(dst, "utf-8");
                    expect(contentSrc).to.be.equal(contentDst);
                    expect(contentDst).to.be.equal("content also as sepcial chars: ›øΩ");
                });
            });
            describe("> when the source is a directory", function () {
                test("> when the source directory does not exist should throw an error", function () {
                    try {
                        copy.copySync(
                            getPath("sync", "this_dir_does_not_exist"),
                            getPath("sync", "this_dir_really_does_not_matter")
                        );
                    } catch (err) {
                        expect((err as NodeJS.ErrnoException).code).to.match(/ENOENT/);
                    }
                });
                test("should copy the directory", function () {
                    const stats = copy.copySync(getPath("sync", "srca"), getPath("sync", "dsta"));
                    expect(fs.statSync(getPath("sync", "dsta")).isDirectory()).to.be.true;
                    let copiedSize = 0;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("sync", ["dsta", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(fs.statSync(getPath("sync", ["dsta", "subdir"])).isDirectory()).to.be.true;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("sync", ["dsta", "subdir", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(copiedSize).to.be.equal(stats.copied.size);
                });
                test("should copy the directory with buffer path", function () {
                    const stats = copy.copySync(Buffer.from(getPath("sync", "srca")), getPath("sync", "dsta_buffer"));
                    expect(fs.statSync(getPath("sync", "dsta_buffer")).isDirectory()).to.be.true;
                    let copiedSize = 0;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("sync", ["dsta_buffer", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(fs.statSync(getPath("sync", ["dsta_buffer", "subdir"])).isDirectory()).to.be.true;
                    for (let i = 0; i < FILES; i++) {
                        const statFile = fs.statSync(getPath("sync", ["dsta_buffer", "subdir", i.toString() + ".txt"]));
                        expect(statFile.isFile()).to.be.true;
                        copiedSize += statFile.size;
                    }
                    expect(copiedSize).to.be.equal(stats.copied.size);
                });
                test("when the destination directory does not exist", function () {
                    const src = getPath("sync", "data");
                    const dst = getPath("sync", ["this", "path", "does", "not", "exist"]);
                    copy.copySync(src, dst);
                    expect(fs.readFileSync(NodePath.join(dst, "f1.txt"), "utf-8")).to.be.equal("file1");
                    expect(fs.readFileSync(NodePath.join(dst, "f2.txt"), "utf-8")).to.be.equal("file2");
                });
                test("when src directory does not exist should throw an error", function () {
                    expect(() => copy.copySync("/path/does/not/exist", "/to/any/place"))
                        .to.throw()
                        .to.have.property("code")
                        .to.match(/ENOENT/);
                });
                test("ignoreEmptyFolders option", function () {
                    const src = getPath("sync", "emptyDir");
                    const dst = getPath("sync", "emptyDirDst");
                    copy.copySync(src, dst, { ignoreEmptyFolders: true, filter: /.txt$/i });
                    expect(fs.existsSync(getPath("sync", ["emptyDirDst", "txt"]))).to.be.true;
                    expect(fs.existsSync(getPath("sync", ["emptyDirDst", "js"]))).to.be.false;
                });
            });
            describe("> when the src and dst are identical", function () {
                const fileData = "some data";
                test("when the src and dst are the same file should throw", function () {
                    const file = getPath("sync", "identicalFile");
                    expect(() => copy.copySync(file, file)).to.throw(/Source and destination must not be the same./);
                });
                test("when the src is symlink and points to dst should not copy and keep symlink", function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    } else {
                        const src = getPath("sync", "testLink");
                        const dst = getPath("sync", "identicalFile");
                        copy.copySync(src, dst);
                        expect(fs.readFileSync(dst, "utf-8")).to.be.equal(fileData);
                        expect(fs.readlinkSync(src)).to.be.equal(dst);
                    }
                });
                test("when dst is symlink and points to src should not copy and keep symlink", () => {
                    const src = getPath("sync", "identicalFile1");
                    const dst = getPath("sync", "testLink1");
                    if (common.canSymlinkTest) {
                        expect(() => copy.copySync(src, dst))
                            .to.throw()
                            .to.have.property("code", "EEXIST");
                    }
                });
            });
            describe("> when using dereference", function () {
                before(function () {
                    if (!common.canSymlinkTest) {
                        this.skip();
                    }
                });
                test("copies symlinks by default", function () {
                    copy.copySync(getPath("sync", ["src", "default"]), getPath("sync", ["dst", "default"]));
                    expect(fs.readlinkSync(getPath("sync", ["dst", "default", "fileLink"]))).to.be.equal(
                        getPath("sync", ["src", "default", "file"])
                    );
                    expect(fs.readlinkSync(getPath("sync", ["dst", "default", "dirFileLink"]))).to.be.equal(
                        getPath("sync", ["src", "default", "dir"])
                    );
                });
                test("copies file contents when dereference=true", function () {
                    const dst = getPath("sync", ["dst", "deref"]);
                    copy.copySync(getPath("sync", ["src", "deref"]), dst, {
                        dereference: true,
                    });
                    const fileSymLink = NodePath.join(dst, "fileLink");
                    const dirSymLink = NodePath.join(dst, "dirFileLink");
                    expect(fs.statSync(fileSymLink).isFile()).to.be.true;
                    expect(fs.readFileSync(fileSymLink, "utf-8")).to.be.equal("contents");
                    expect(fs.statSync(dirSymLink).isDirectory()).to.be.true;
                    expect(fs.readdirSync(dirSymLink) as Array<unknown>).to.be.eql(["dirFile"]);
                });
            });
            describe("> /dev/null", function () {
                test("should not throw an error", function () {
                    if (common.IsWindows) {
                        expect(() => copy.copySync("/dev/null", getPath("sync", "devnull")))
                            .to.throw()
                            .to.have.property("code", "ENOENT");
                    } else {
                        expect(() => copy.copySync("/dev/null", getPath("sync", "devnull"))).to.not.throw();
                        expect(fs.statSync(getPath("sync", "devnull")).size).to.be.equal(0);
                    }
                });
            });
            describe("> permissions", function () {
                test("should maintain file permissions and ownership", function () {
                    const statF1 = chmodFile(getPath("sync", ["srcPerm", "f1.txt"]), 0o666, ownerFile);
                    const statD1 = chmodDir(getPath("sync", ["srcPerm", "someDir"]), 0o766, ownerDir);
                    const statF2 = chmodFile(getPath("sync", ["srcPerm", "someDir", "f2.bin"]), 0o777, ownerFile);
                    const statD2 = chmodDir(getPath("sync", ["srcPerm", "anotherDir"]), 0o444, ownerDir);
                    copy.copySync(getPath("sync", "srcPerm"), getPath("sync", "dstPerm"));
                    const newF1 = getPath("sync", ["dstPerm", "f1.txt"]);
                    const newD1 = getPath("sync", ["dstPerm", "someDir"]);
                    const newF2 = getPath("sync", ["dstPerm", "someDir", "f2.bin"]);
                    const newD2 = getPath("sync", ["dstPerm", "anotherDir"]);
                    const statNewF1 = fs.lstatSync(newF1);
                    expect(statNewF1.mode).to.be.equal(statF1.mode);
                    expect(statNewF1.gid).to.be.equal(statF1.gid);
                    expect(statNewF1.uid).to.be.equal(statF1.uid);
                    const statNewD1 = fs.lstatSync(newD1);
                    expect(statNewD1.mode).to.be.equal(statD1.mode);
                    expect(statNewD1.gid).to.be.equal(statD1.gid);
                    expect(statNewD1.uid).to.be.equal(statD1.uid);
                    const statNewF2 = fs.lstatSync(newF2);
                    expect(statNewF2.mode).to.be.equal(statF2.mode);
                    expect(statNewF2.gid).to.be.equal(statF2.gid);
                    expect(statNewF2.uid).to.be.equal(statF2.uid);
                    const statNewD2 = fs.lstatSync(newD2);
                    expect(statNewD2.mode).to.be.equal(statD2.mode);
                    expect(statNewD2.gid).to.be.equal(statD2.gid);
                    expect(statNewD2.uid).to.be.equal(statD2.uid);
                });
            });
            describe("> preserve timestamps option", function () {
                test("should have the same timestamps on copy", function () {
                    const src = getPath("sync", "timestamp");
                    const dst = getPath("sync", "timestampOn");
                    copy.copySync(src, dst, { preserveTimestamps: true });
                    const statSrc = fs.statSync(getPath("sync", ["timestamp", "file1.txt"]));
                    const statDst = fs.statSync(getPath("sync", ["timestampOn", "file1.txt"]));
                    expect(statSrc.atime).to.be.eql(statDst.atime);
                    expect(statSrc.mtime).to.be.eql(statDst.mtime);
                });
            });
            describe("> copy to self", function () {
                test("returns an error when user copies parent to itself", function () {
                    expect(() => copy.copySync(getPath("sync", "./toSelf/src"), getPath("sync", "./toSelf/src/out")))
                        .to.throw()
                        .to.have.property("code", "EINVAL");
                });
                test("copies 'src' to 'src' itself don't throw error", function () {
                    expect(() => copy.copySync(getPath("sync", "./toSelf/src"), getPath("sync", "./toSelf/src")))
                        .to.throw()
                        .to.have.property("code", "EINVAL");
                });
                test("copies 'src to 'src_out'", function () {
                    expect(() =>
                        copy.copySync(getPath("sync", "./toSelf/src"), getPath("sync", "./toSelf/srcOut"))
                    ).not.to.throw();
                });
                test("copies 'src' to 'src_symlink'", function () {
                    if (common.canSymlinkTest) {
                        expect(() =>
                            copy.copySync(getPath("sync", "./toSelf/src"), getPath("sync", "./toSelf/src_symlink"))
                        )
                            .to.throw()
                            .to.have.property("code", "EISDIR");
                    }
                });
                test("copies file 'src/file.txt' to file 'src/file.txt' don't throw error", function () {
                    expect(() =>
                        copy.copySync(
                            getPath("sync", "./toSelf/src/file.txt"),
                            getPath("sync", "./toSelf/src/file.txt")
                        )
                    )
                        .to.throw()
                        .to.have.property("code", "EINVAL");
                });
                test("copies directory 'src' to 'src/src_out'", function () {
                    expect(() =>
                        copy.copySync(
                            getPath("sync", "./toSelf/src"),
                            getPath("sync", "./toSelf/src" + getPath("sync", "./toSelf/src/out"))
                        )
                    )
                        .to.throw()
                        .to.have.property("code", "EINVAL");
                });
            });
        });
    });
});
