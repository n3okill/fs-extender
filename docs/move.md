[fs-extender](../README.md) / Move

# Move Items

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [move](#move)
    -   [moveSync](#movesync)
    -   [Promises API](#promises-api)
        -   [fsPromises.move](#fspromisesmove)
-   [Type Aliases](#type-aliases)
    -   [MoveOptions](#moveoptions)
    -   [MoveStreamOutType](#movestreamouttype)

## Functions

### move

▸ **move**(`src`, `dst`, `options`, `callback`): `void`

Move items in the file system async

```js
import * as fs from "fs-extender";
fs.move(srcPath, dstPath, (err) => {
    if (!err) {
        console.log("Files moved with success");
    }
});
```

##### Parameters

| Name       | Type                                | Description                                                      |
| :--------- | :---------------------------------- | :--------------------------------------------------------------- |
| `src`      | [`PathLike`][]                      | the path to the items being moved                                |
| `dst`      | [`PathLike`][]                      | the destination path to where the items will be moved            |
| `options`  | `undefined` \| [`MoveOptions`][]    | [`MoveOptions`][]                                                |
| `callback` | (`err`: `ErrnoException`) => `void` | the callback function that will be called after the list is done |

##### Returns

`void`

▸ **move**(`src`, `dst`, `callback`): `void`

##### Parameters

| Name       | Type                                | Description                                                      |
| :--------- | :---------------------------------- | :--------------------------------------------------------------- |
| `src`      | [`PathLike`][]                      | the path to the items being moved                                |
| `dst`      | [`PathLike`][]                      | the destination path to where the items will be moved            |
| `callback` | (`err`: `ErrnoException`) => `void` | the callback function that will be called after the list is done |

##### Returns

`void`

---

### moveSync

▸ **moveSync**(`src`, `dst`, `options?`): `void`

Move items in the file system sync

```js
import * as fs from "fs-extender";
fs.moveSync(srcPath, dstPath);
console.log("Files moved with success");
```

##### Parameters

| Name       | Type              | Description                                           |
| :--------- | :---------------- | :---------------------------------------------------- |
| `src`      | [`PathLike`][]    | the path to the items being moved                     |
| `dst`      | [`PathLike`][]    | the destination path to where the items will be moved |
| `options?` | [`MoveOptions`][] | [`MoveOptions`][]                                     |

##### Returns

`void`

---

### Promises API

#### fsPromises.move

▸ **fsPromises.move**(`src`, `dst`, `options?`): `void`

Move items in the file system sync

```js
import * as fs from "fs-extender";
await fs.promises.move(srcPath, dstPath);
console.log("Files moved with success");
```

##### Parameters

| Name       | Type              | Description                                           |
| :--------- | :---------------- | :---------------------------------------------------- |
| `src`      | [`PathLike`][]    | the path to the items being moved                     |
| `dst`      | [`PathLike`][]    | the destination path to where the items will be moved |
| `options?` | [`MoveOptions`][] | [`MoveOptions`][]                                     |

##### Returns

`void`

---

## Type Aliases

### MoveOptions

Ƭ **MoveOptions**: `Object`

Options for move

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `bypassRename?` | `boolean` | This option allows to bypass the `renameSync` function in patch, because it can stop the event loop in `win32` if the file can't be renamed for some reason, default: `false` |
| `merge?` | `boolean` | Merge items at destination default `false` If overwrite `true` will overwrite items at destination otherwise triggers an error when a file already exists |
| `overwrite?` | `boolean` | Overwrite existing destination items, default to `false` |
| `overwriteNewer?` | `boolean` | Overwrite only if source file is newer than destination file default `false` this works by checking the last time the files have been modified `stat.mTime` |
| `stream?` | [`Readable`][] | if a stream is passed then it's possible to check the move process with <pre>stream.on("data",(chunk:string)=>{<br /> const obj:[`MoveStreamOutType`][] = JSON.parse(chunk);</br>});</pre> this doesn't work with [`moveSync`][] |

---

### MoveStreamOutType

Ƭ **MoveStreamOutType**: `Object`

##### Type declaration

| Name        | Type                    |
| :---------- | :---------------------- |
| `error?`    | `NodeJS.ErrnoException` |
| `item`      | `string`                |
| `operation` | `string`                |
| `type`      | `string`                |

---

[`pathlike`]: types.md#pathlike
[`moveoptions`]: #moveoptions
[`readable`]: https://github.com/nodejs/node/blob/master/doc/api/stream.md#readable-streams
[`movestreamouttype`]: #movestreamouttype
[`movesync`]: #movesync
