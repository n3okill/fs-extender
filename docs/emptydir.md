[fs-extender](../README.md) / EmptyDir

# Empty Directory

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [emptyDir](#emptydir)
    -   [emptyDirSync](#emptydirsync)
    -   [Promises API](#promises-api)
        -   [fsPromises.emptyDir](#fspromisesemptydir)
-   [Type Aliases](#type-aliases)
    -   [EmptyDirOptions](#emptydiroptions)

## Functions

### emptyDir

▸ **emptyDir**(`path`, `options`, `callback`): `void`

Delete all items inside a directory

```js
import * as fs from "fs-extender";
fs.emptyDir(path, (err) => {
    if (!err) {
        console.log("dir is empty");
    }
});
```

##### Parameters

| Name       | Type                                 | Description                                   |
| :--------- | :----------------------------------- | :-------------------------------------------- |
| `path`     | [`PathLike`][]                       | path to remove                                |
| `options`  | `undefined` \| [`EmptyDirOptions`][] | [`EmptyDirOptions`][]                         |
| `callback` | (`err`: `ErrnoException`) => `void`  | function to be called when emptyDir completes |

##### Returns

`void`

▸ **emptyDir**(`path`, `callback`): `void`

##### Parameters

| Name       | Type                                | Description                                   |
| :--------- | :---------------------------------- | :-------------------------------------------- |
| `path`     | [`PathLike`][]                      | path to remove                                |
| `callback` | (`err`: `ErrnoException`) => `void` | function to be called when emptyDir completes |

##### Returns

`void`

---

### emptyDirSync

▸ **emptyDirSync**(`path`, `options?`): `void`

Delete all items inside a directory

```js
import * as fs from "fs-extender";
fs.emptyDirSync(path);
console.log("dir is empty");
```

##### Parameters

| Name       | Type                  | Description           |
| :--------- | :-------------------- | :-------------------- |
| `path`     | [`PathLike`][]        | path to remove        |
| `options?` | [`EmptyDirOptions`][] | [`EmptyDirOptions`][] |

##### Returns

`void`

---

### Promises API

#### fsPromises.emptyDir

▸ **fsPromises.emptyDir**(`path`, `options?`): `void`

Delete all items inside a directory

```js
import * as fs from "fs-extender";
await fs.promises.emptyDir(path);
console.log("dir is empty");
```

##### Parameters

| Name       | Type                  | Description           |
| :--------- | :-------------------- | :-------------------- |
| `path`     | [`PathLike`][]        | path to remove        |
| `options?` | [`EmptyDirOptions`][] | [`EmptyDirOptions`][] |

##### Returns

`void`

---

## Type Aliases

### EmptyDirOptions

Ƭ **EmptyDirOptions**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `force?` | `boolean` | When `true`, exceptions will be ignored if path does not exist. Default: `false`. |
| `maxRetries?` | `number` | If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry the operation with a linear backoff wait of `retryDelay` milliseconds longer on each try. This option represents the number of retries. Default: `0`. |
| `retryDelay?` | `number` | The amount of time in milliseconds to wait between retries. Default: `100`. |
| `stream?` | [`Readable`][] | if a stream is passed then it's possible to check the rm process with <pre>stream.on("data",(chunk:string)=>{<br /> const obj:[`RmStreamOutType`][] = JSON.parse(chunk); <br />});</pre> this doesn't work with [`emptyDirSync`](#emptydirsync) |

---

[`emptydiroptions`]: #emptydiroptions
[`pathlike`]: types.md#pathlike
[`readable`]: https://github.com/nodejs/node/blob/master/doc/api/stream.md#readable-streams
[`rmstreamouttype`]: rm.md#rmstreamouttype
