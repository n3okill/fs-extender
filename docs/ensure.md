[fs-extender](../README.md) / Ensure

# Ensure

## Table of Contents

-   [ensureDir](#ensuredir)
-   [ensureDirSync](#ensuredirsync)
-   [ensureFile](#ensurefile)
-   [ensureFileSync](#ensurefilesync)
-   [ensureLink](#ensurelink)
-   [ensureLinkSync](#ensurelinksync)
-   [ensureSymlink](#ensuresymlink)
-   [ensureSymlinkSync](#ensuresymlinksync)
-   [Promises API](#promises-api)
    -   [fsPromises.ensureDir](#fspromisesensuredir)
    -   [fsPromises.ensureFile](#fspromisesensurefile)
    -   [fsPromises.ensureLink](#fspromisesensurelink)
    -   [fsPromises.ensureSymlink](#fspromisesensuresymlink)
-   [EnsureOptionsDir](#ensureoptionsdir)
-   [EnsureOptionsFile](#ensureoptionsfile)
-   [EnsureOptionsFileStreamOptions](#ensureoptionsfilestreamoptions)
-   [EnsureOptionsSymlink](#ensureoptionssymlink)
-   [EnsureOptionsSymlinkType](#ensureoptionssymlinktype)

## Functions

### ensureDir

▸ **ensureDir**(`path`, `options`, `callback`): `void`

EnsureDir - ensures directory existence on file system

```js
import * as fs from "fs-extender";
fs.ensureDir(path, (err) => {
    if (!err) {
        console.log(`${path} is ensured in the file system.`);
    }
});
```

##### Parameters

| Name       | Type                                                        | Description               |
| :--------- | :---------------------------------------------------------- | :------------------------ |
| `path`     | [`PathLike`][]                                              | the path to the directory |
| `options`  | [`EnsureOptionsDir`][]                                      | [`EnsureOptionsDir`][]    |
| `callback` | (`err`: `ErrnoException`, `path`: [`PathLike`][]) => `void` |

##### Returns

`void`

▸ **ensureDir**(`path`, `callback`): `void`

##### Parameters

| Name       | Type                                                        | Description               |
| :--------- | :---------------------------------------------------------- | :------------------------ |
| `path`     | [`PathLike`][]                                              | the path to the directory |
| `callback` | (`err`: `ErrnoException`, `path`: [`PathLike`][]) => `void` |

##### Returns

`void`

---

### ensureDirSync

▸ **ensureDirSync**(`path`, `options?`): [`PathLike`][]

EnsureDir - ensures directory existence on file system

```js
import * as fs from "fs-extender";
fs.ensureDirSync(path);
console.log(`${path} is ensured in the file system.`);
```

##### Parameters

| Name       | Type                   | Description               |
| :--------- | :--------------------- | :------------------------ |
| `path`     | [`PathLike`][]         | the path to the directory |
| `options?` | [`EnsureOptionsDir`][] | [`EnsureOptionsDir`][]    |

##### Returns

[`PathLike`][] - path to the directory

---

### ensureFile

▸ **ensureFile**(`path`, `options`, `callback`): `void`

ensureFile - ensures file existence on file system

```js
import * as fs from "fs-extender";
fs.ensureFile(path, (err) => {
    if (!err) {
        console.log(`${path} is ensured in the file system.`);
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | the path to the file |
| `options` | `undefined` \| [`EnsureOptionsFile`][] & { `stream?`: `false` } | [`EnsureOptionsFile`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `path?`: [`PathLike`][]) => `void` | `(err: Error \|null, (path: fs.PathLike))` |

##### Returns

`void`

▸ **ensureFile**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | the path to the file |
| `options` | `undefined` \| [`EnsureOptionsFile`][] & { `stream`: `true` } | [`EnsureOptionsFile`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `stream?`: [`WriteStream`][]) => `void` | `(err: Error \|null, (stream: fs.WriteStream))` |

##### Returns

`void`

▸ **ensureFile**(`path`, `callback`): `void`

##### Parameters

| Name       | Type                                                         | Description          |
| :--------- | :----------------------------------------------------------- | :------------------- |
| `path`     | [`PathLike`][]                                               | the path to the file |
| `callback` | (`err`: `ErrnoException`, `path?`: [`PathLike`][]) => `void` |

##### Returns

`void`

---

### ensureFileSync

▸ **ensureFileSync**(`path`, `options?`): [`PathLike`][]

ensureFile - ensures file existence on file system

```js
import * as fs from "fs-extender";
fs.ensureFileSync(path);
console.log(`${path} is ensured in the file system.`);
```

##### Parameters

| Name       | Type                                             | Description             |
| :--------- | :----------------------------------------------- | :---------------------- |
| `path`     | [`PathLike`][]                                   | the path to the file    |
| `options?` | [`EnsureOptionsFile`][] & { `stream?`: `false` } | [`EnsureOptionsFile`][] |

##### Returns

[`PathLike`][]

▸ **ensureFileSync**(`path`, `options`): `NodeFs.WriteStream`

##### Parameters

| Name      | Type                                           | Description             |
| :-------- | :--------------------------------------------- | :---------------------- |
| `path`    | [`PathLike`][]                                 | the path to the file    |
| `options` | [`EnsureOptionsFile`][] & { `stream`: `true` } | [`EnsureOptionsFile`][] |

##### Returns

[`WriteStream`][]

---

### ensureLink

▸ **ensureLink**(`srcPath`, `dstPath`, `callback`): `void`

ensureLink - ensures link existence on file system

```js
import * as fs from "fs-extender";
fs.ensureLink(src, dst, (err) => {
    if (!err) {
        console.log(`Link is ensured in the file system.`);
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `srcPath` | [`PathLike`][] | the source path of the link |
| `dstPath` | [`PathLike`][] | the destination path to the link |
| `callback` | (`err`: `null` \| `ErrnoException`, `dstPath?`: [`PathLike`][]) => `void` | (err: Error \| null, dstPath: fs.PathLike) |

##### Returns

`void`

---

### ensureLinkSync

▸ **ensureLinkSync**(`srcPath`, `dstPath`): [`PathLike`][]

ensureLink - ensures link existence on file system

```js
import * as fs from "fs-extender";
fs.ensureLinkSync(src, dst);
console.log(`Link is ensured in the file system.`);
```

##### Parameters

| Name      | Type           | Description                      |
| :-------- | :------------- | :------------------------------- |
| `srcPath` | [`PathLike`][] | the source path of the link      |
| `dstPath` | [`PathLike`][] | the destination path to the link |

##### Returns

[`PathLike`][]

dstPath: fs.PathLike

---

### ensureSymlink

▸ **ensureSymlink**(`srcPath`, `dstPath`, `options`, `callback`): `void`

ensureSymlink - ensures symlink existence on file system

```js
import * as fs from "fs-extender";
fs.ensureSymlink(src, dst, (err) => {
    if (!err) {
        console.log(`Symlink is ensured in the file system.`);
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `srcPath` | [`PathLike`][] | the source path of the symlink |
| `dstPath` | [`PathLike`][] | the destination path to the symlink |
| `options` | [`EnsureOptionsSymlink`][] | [`EnsureOptionsSymlink`][] |
| `callback` | (`err`: `ErrnoException`, `dstPath?`: [`PathLike`][]) => `void` | `(err: Error \| null, dstPath: fs.PathLike)` |

##### Returns

`void`

▸ **ensureSymlink**(`srcPath`, `dstPath`, `callback`): `void`

##### Parameters

| Name       | Type                                                            | Description                         |
| :--------- | :-------------------------------------------------------------- | :---------------------------------- |
| `srcPath`  | [`PathLike`][]                                                  | the source path of the symlink      |
| `dstPath`  | [`PathLike`][]                                                  | the destination path to the symlink |
| `callback` | (`err`: `ErrnoException`, `dstPath?`: [`PathLike`][]) => `void` |

##### Returns

`void`

---

### ensureSymlinkSync

▸ **ensureSymlinkSync**(`srcPath`, `dstPath`, `options?`): [`PathLike`][]

ensureSymlink - ensures symlink existence on file system

```js
import * as fs from "fs-extender";
fs.ensureSymlinkSync(src, dst);
console.log(`Symlink is ensured in the file system.`);
```

##### Parameters

| Name       | Type                       | Description                         |
| :--------- | :------------------------- | :---------------------------------- |
| `srcPath`  | [`PathLike`][]             | the source path of the symlink      |
| `dstPath`  | [`PathLike`][]             | the destination path to the symlink |
| `options?` | [`EnsureOptionsSymlink`][] | [`EnsureOptionsSymlink`][]          |

##### Returns

[`PathLike`][]

`dstPath: fs.PathLike`

---

### Promises API

#### fsPromises.ensureDir

▸ **fsPromises.ensureDir**(`path`, `options?`): [`PathLike`][]

EnsureDir - ensures directory existence on file system

```js
import * as fs from "fs-extender";
await fs.promises.ensureDir(path);
console.log(`${path} is ensured in the file system.`);
```

##### Parameters

| Name       | Type                   | Description               |
| :--------- | :--------------------- | :------------------------ |
| `path`     | [`PathLike`][]         | the path to the directory |
| `options?` | [`EnsureOptionsDir`][] | [`EnsureOptionsDir`][]    |

##### Returns

[`PathLike`][] - path to the directory

---

#### fsPromises.ensureFile

▸ **fsPromises.ensureFile**(`path`, `options?`): [`PathLike`][]

ensureFile - ensures file existence on file system

```js
import * as fs from "fs-extender";
await fs.promises.ensureFile(path);
console.log(`${path} is ensured in the file system.`);
```

##### Parameters

| Name       | Type                                             | Description             |
| :--------- | :----------------------------------------------- | :---------------------- |
| `path`     | [`PathLike`][]                                   | the path to the file    |
| `options?` | [`EnsureOptionsFile`][] & { `stream?`: `false` } | [`EnsureOptionsFile`][] |

##### Returns

[`PathLike`][]

▸ **fsPromises.ensureFile**(`path`, `options`): `NodeFs.WriteStream`

##### Parameters

| Name      | Type                                           | Description             |
| :-------- | :--------------------------------------------- | :---------------------- |
| `path`    | [`PathLike`][]                                 | the path to the file    |
| `options` | [`EnsureOptionsFile`][] & { `stream`: `true` } | [`EnsureOptionsFile`][] |

##### Returns

[`WriteStream`][]

---

#### fsPromises.ensureLink

▸ **fsPromises.ensureLink**(`srcPath`, `dstPath`): [`PathLike`][]

ensureLink - ensures link existence on file system

```js
import * as fs from "fs-extender";
await fs.promises.ensureLink(src, dst);
console.log(`Link is ensured in the file system.`);
```

##### Parameters

| Name      | Type           | Description                      |
| :-------- | :------------- | :------------------------------- |
| `srcPath` | [`PathLike`][] | the source path of the link      |
| `dstPath` | [`PathLike`][] | the destination path to the link |

##### Returns

[`PathLike`][]

dstPath: fs.PathLike

---

#### fsPromises.ensureSymlink

▸ **fsPromises.ensureSymlink**(`srcPath`, `dstPath`, `options?`): [`PathLike`][]

ensureSymlink - ensures symlink existence on file system

```js
import * as fs from "fs-extender";
await fs.promises.ensureSymlink(src, dst);
console.log(`Symlink is ensured in the file system.`);
```

##### Parameters

| Name       | Type                       | Description                         |
| :--------- | :------------------------- | :---------------------------------- |
| `srcPath`  | [`PathLike`][]             | the source path of the symlink      |
| `dstPath`  | [`PathLike`][]             | the destination path to the symlink |
| `options?` | [`EnsureOptionsSymlink`][] | [`EnsureOptionsSymlink`][]          |

##### Returns

[`PathLike`][]

`dstPath: fs.PathLike`

---

## Type Aliases

### EnsureOptionsDir

Ƭ **EnsureOptionsDir**: `Object`

Options for ensureDir and ensureDirSync

##### Type declaration

| Name    | Type       | Description                                |
| :------ | :--------- | :----------------------------------------- |
| `mode?` | [`Mode`][] | Mode defined for directory, default is 777 |

---

### EnsureOptionsFile

Ƭ **EnsureOptionsFile**: `Object`

Options for ensureFile and ensureFileSync

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `mode?` | [`Mode`][] | Mode defined for directory, default is 777 |
| `data?` | `string` \| `NodeJS.ArrayBufferView` | Data to be written in the file |
| `encoding?` | [`BufferEncoding`][] | Encoding to be used when data is string |
| `dirMode?` | [`Mode`][] | Mode defined for the directory where file will be created |
| `stream?` | `boolean` | File to be created must return a stream to the user, default is false |
| `streamOptions?` | [`BufferEncoding`][] \| [`EnsureOptionsFileStreamOptions`][] | Options for the stream creation when stream is true |
| `flag?` | `string` | Flag used to access the file |

---

### EnsureOptionsFileStreamOptions

Ƭ **EnsureOptionsFileStreamOptions**: `Object`

Options for stream creation when stream is true

##### Type declaration

| Name             | Type                                     |
| :--------------- | :--------------------------------------- |
| `autoClose?`     | `boolean`                                |
| `emitClose?`     | `boolean`                                |
| `encoding?`      | `BufferEncoding`                         |
| `fd?`            | `number` \| `NodeFs.promises.FileHandle` |
| `flags?`         | `string`                                 |
| `highWaterMark?` | `number`                                 |
| `mode?`          | `number`                                 |
| `start?`         | `number`                                 |

---

### EnsureOptionsSymlink

Ƭ **EnsureOptionsSymlink**: `Object`

options for ensureSymlink and ensureSymlinkSync

##### Type declaration

| Name    | Type                           |
| :------ | :----------------------------- |
| `type?` | [`EnsureOptionsSymlinkType`][] |

---

### EnsureOptionsSymlinkType

Ƭ **EnsureOptionsSymlinkType**: `"file"` \| `"dir"` \| `"junction"`

Type options for ensureSymlink and ensureSymlinkSync

---

[`pathlike`]: types.md#pathlike
[`writestream`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fswritestream
[`ensureoptionsdir`]: #ensureoptionsdir
[`ensureoptionsfile`]: #ensureoptionsfile
[`ensureoptionssymlink`]: #ensureoptionssymlink
[`ensureoptionsfilestreamoptions`]: #ensureoptionsfilestreamoptions
[`ensureoptionssymlinktype`]: #ensureoptionssymlinktype
[`mode`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#file-modes
[`bufferencoding`]: types.md#bufferencoding
