import * as fs from "./patch";
import * as NodeFs from "fs";

declare module "fs" {
    interface ReadStream {
        flags: OpenMode;
        mode?: number;
        autoClose: boolean;
        fd?: number;
    }
    interface WriteStream {
        flags: OpenMode;
        mode?: number;
        autoClose: boolean;
        fd?: number;
    }
}

export interface StreamOptions {
    flags?: string | undefined;
    encoding?: BufferEncoding | undefined;
    fd?: number | NodeFs.promises.FileHandle | undefined;
    mode?: number | undefined;
    autoClose?: boolean | undefined;
    /**
     * @default false
     */
    emitClose?: boolean | undefined;
    start?: number | undefined;
    highWaterMark?: number | undefined;
}
export interface ReadStreamOptions extends StreamOptions {
    end?: number | undefined;
}

export class ReadStream extends NodeFs.ReadStream {
    public open(): void {
        fs.open(this.path, this.flags, this.mode, (err: NodeJS.ErrnoException | null, fd?: number) => {
            /* istanbul ignore next */
            if (err) {
                if (this.autoClose) {
                    this.destroy();
                }
                this.emit("error", err);
            } else {
                this.fd = fd;
                this.emit("open", fd);
                this.read();
            }
        });
    }
}

export class WriteStream extends NodeFs.WriteStream {
    public open(): void {
        fs.open(this.path, this.flags, this.mode, (err: NodeJS.ErrnoException | null, fd?: number) => {
            /* istanbul ignore next */
            if (err) {
                this.destroy();
                this.emit("error", err);
            } else {
                this.fd = fd;
                this.emit("open", fd);
            }
        });
    }
}

export class FileReadStream extends ReadStream {}
export class FileWriteStream extends WriteStream {}

export function createReadStream(path: NodeFs.PathLike, options?: BufferEncoding | ReadStreamOptions): ReadStream {
    // Typings are wrong [remove as any] as soon as types are correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (ReadStream as any)(path, options);
}

export function createWriteStream(path: NodeFs.PathLike, options?: BufferEncoding | StreamOptions): WriteStream {
    // Typings are wrong [remove as any] as soon as types are correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (WriteStream as any)(path, options);
}
