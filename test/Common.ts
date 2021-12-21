import { Type } from "@n3okill/utils";
import * as NodeFs from "fs";
import * as NodeOs from "os";
import NodePath from "path-extender";

export type TestDirStructure = { [key: string]: string | TestDirStructure };
export const IsWindows = /^win/.test(NodeOs.platform());
export class Common {
    readonly IsWindows = IsWindows;
    public canSymlinkTest = false;

    //readonly cwd;
    private _tempTestPath?: string;

    constructor(readonly name: string, private drive?: TestDirStructure) {
        try {
            NodeFs.symlinkSync(
                NodePath.join(NodeOs.tmpdir(), "fs-extender-test-symlink-2"),
                NodePath.join(NodeOs.tmpdir(), "fs-extender-test-symlink-1")
            );
            this.canSymlinkTest = true;
            NodeFs.unlinkSync(NodePath.join(NodeOs.tmpdir(), "fs-extender-test-symlink-1"));
        } catch (err) {
            this.canSymlinkTest = false;
        }
    }

    public setTestFiles(drive: TestDirStructure): void {
        this.drive = drive;
    }

    public getPath(file?: Buffer | Buffer[]): Buffer;
    public getPath(file?: string | string[]): string;
    public getPath(file?: string | string[] | Buffer | Buffer[]): string | Buffer {
        if (this._tempTestPath) {
            if (file) {
                if (Buffer.isBuffer(file)) {
                    return NodePath.join(Buffer.from(this._tempTestPath), file);
                } else if (typeof file === "string") {
                    return NodePath.join(this._tempTestPath, file);
                } else if (Type.isArray(file)) {
                    if (file.some((s) => Buffer.isBuffer(s))) {
                        const f = file.map((s) => (Buffer.isBuffer(s) ? s : Buffer.from(s)));
                        return NodePath.join(Buffer.from(this._tempTestPath), ...f);
                    } else {
                        return NodePath.join(this._tempTestPath, ...file);
                    }
                }
            } else {
                return this._tempTestPath;
            }
        }
        throw new TypeError("'tempTestPath' is not defined.");
    }

    public getPathRelative(file: string | string[]): string {
        if (Type.isString(file)) {
            return NodePath.join(file as string);
        } else {
            return NodePath.join(...file);
        }
    }

    public async beforeAll(): Promise<void> {
        this._tempTestPath = await NodeFs.promises.mkdtemp(NodePath.join(NodeOs.tmpdir(), this.name + "-"));
        const umask = process.umask(0);
        await this.createFiles(this._tempTestPath, this.drive);
        process.umask(umask);
    }

    public async afterAll(): Promise<void> {
        if (this._tempTestPath) {
            await this.cleanTestDir(this._tempTestPath);
            await NodeFs.promises.rmdir(this._tempTestPath);
        }
    }

    public async createFiles(path: string | Buffer, obj?: TestDirStructure): Promise<void> {
        if (!obj) {
            throw new Error("test file structure must be defined.");
        }
        for (const key of Object.keys(obj)) {
            if (Type.isString(obj[key]) || Type.isBuffer(obj[key])) {
                await NodeFs.promises.writeFile(NodePath.join(path, key), obj[key] as string);
            } else if (Type.isObject(obj[key])) {
                const p = NodePath.join(path, key);
                await NodeFs.promises.mkdir(p);
                await this.createFiles(p, obj[key] as TestDirStructure);
            }
        }
    }

    private async cleanTestDir(path: string): Promise<void> {
        if (NodeFs.existsSync(path)) {
            for (const file of await NodeFs.promises.readdir(path)) {
                const p = NodePath.join(path, file);
                if ((await NodeFs.promises.lstat(p)).isDirectory()) {
                    await this.cleanTestDir(p);
                    try {
                        await NodeFs.promises.rmdir(p);
                    } catch (err) {
                        if ((err as NodeJS.ErrnoException).code === "EPERM") {
                            await NodeFs.promises.chmod(p, 0o777);
                            await NodeFs.promises.rmdir(p);
                        } else {
                            throw err;
                        }
                    }
                } else {
                    await NodeFs.promises.unlink(p);
                }
            }
        }
    }
}
