import * as NodeUrl from "url";
import { Type } from "@n3okill/utils";
import * as fs from "./patch";

/** @hidden */
export function getCallback(opt: unknown, callback: unknown): (...args: unknown[]) => void {
    if (Type.isFunction(opt) && !callback) {
        return opt as (...args: unknown[]) => void;
    }
    return callback as (...args: unknown[]) => void;
}

//todo: validar o tipo de variavel fazendo entrar o tipo na funcao e usando o Type.is...
export function getObjectOption<T>(options: unknown = {}, name: string, defaultValue: T): T {
    if (name in (options as Record<string, T>)) {
        return (options as Record<string, T>)[name];
    }
    return defaultValue;
}

export enum ItemType {
    file,
    dir,
    blockDevice,
    characterDevice,
    symbolikLink,
    socket,
    fifo,
    unknown,
}

/* istanbul ignore next */
export function getItemType(stat: fs.Stats): ItemType {
    if (stat.isBlockDevice()) {
        return ItemType.blockDevice;
    } else if (stat.isCharacterDevice()) {
        return ItemType.characterDevice;
    } else if (stat.isDirectory()) {
        return ItemType.dir;
    } else if (stat.isFIFO()) {
        return ItemType.fifo;
    } else if (stat.isFile()) {
        return ItemType.file;
    } else if (stat.isSocket()) {
        return ItemType.socket;
    } else if (stat.isSymbolicLink()) {
        return ItemType.symbolikLink;
    } else {
        return ItemType.unknown;
    }
}

/* istanbul ignore next */
export function getItemTypeName(t: ItemType): string {
    switch (t) {
        case ItemType.blockDevice:
            return "BlockDevice";
        case ItemType.characterDevice:
            return "CharacterDevice";
        case ItemType.dir:
            return "Dir";
        case ItemType.fifo:
            return "FIFO";
        case ItemType.file:
            return "File";
        case ItemType.socket:
            return "Socket";
        case ItemType.symbolikLink:
            return "SymbolikLink";
        default:
            return "Unknown";
    }
}

/* istanbul ignore next */
export function parseBoolean(val = "false"): boolean {
    val = String(val).toLowerCase();
    switch (val) {
        case "true":
        case "1":
            return true;
        default:
            return false;
    }
}

/* istanbul ignore next */
function isURLInstance(fileURLOrPath: NodeUrl.URL) {
    return fileURLOrPath != null && fileURLOrPath.href && fileURLOrPath.origin;
}

/* istanbul ignore next */
export function fileURLToPath(str: string | NodeUrl.URL): string {
    if ((typeof str === "string" && str.startsWith("file://")) || isURLInstance(str as never)) {
        try {
            return NodeUrl.fileURLToPath(str as never);
        } catch (err) {}
    }
    return str as string;
}

/* istanbul ignore next */
export function toBufferOrNotToBuffer(isBuffer: boolean, str: string | Buffer): string | Buffer {
    return isBuffer ? (Buffer.isBuffer(str) ? str : Buffer.from(str)) : Buffer.isBuffer(str) ? str.toString() : str;
}

/* istanbul ignore next */
export function toStringOrBuffer(isBuffer: boolean, str: fs.PathLike): string | Buffer {
    if (isBuffer) {
        if (Buffer.isBuffer(str)) {
            return str;
        } else {
            return Buffer.from(fileURLToPath(str));
        }
    } else {
        if (Buffer.isBuffer(str)) {
            return str.toString();
        } else {
            return fileURLToPath(str);
        }
    }
}

/* istanbul ignore next */
export function equal(obj1: string | Buffer, obj2: string | Buffer): boolean {
    if (Buffer.isBuffer(obj1)) {
        if (Buffer.isBuffer(obj2)) {
            return obj1.equals(obj2);
        }
        return false;
    } else {
        if (Buffer.isBuffer(obj2)) {
            return false;
        }
        return obj1 === obj2;
    }
}

/** @internal */
/* istanbul ignore next */
export function replace(
    str: string | Buffer,
    searchValue: string | Buffer,
    replaceValue: string | Buffer
): string | Buffer {
    if (Type.isString(str)) {
        if (Type.isBuffer(searchValue)) {
            searchValue = searchValue.toString();
        }
        if (Type.isBuffer(replaceValue)) {
            replaceValue = replaceValue.toString();
        }
        return (str as string).replace(searchValue as string, replaceValue as string);
    } else {
        if (Type.isString(searchValue)) {
            searchValue = Buffer.from(searchValue);
        }
        if (Type.isString(replaceValue)) {
            replaceValue = Buffer.from(replaceValue);
        }
        const idx = (str as Buffer).indexOf(searchValue);
        if (idx !== -1) {
            const after = replace(str.slice(idx + (searchValue as Buffer).length), searchValue, replaceValue);
            const len = idx + (replaceValue as Buffer).length + after.length;
            return Buffer.concat([str.slice(0, idx) as Buffer, replaceValue as Buffer, after as Buffer], len);
        }
        return str;
    }
}
