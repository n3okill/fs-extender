[fs-extender](../README.md) / Rm

# Remove Items

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [rm](#rm)
    -   [rmSync](#rmsync)
    -   [Promises API](#promises-api)
        -   [fsPromises.rm](#fspromisesrm)
-   [Type Aliases](#type-aliases)
    -   [RmOptions](#rmoptions)
    -   [RmStreamOutType](#rmstreamouttype)

## Functions

### rm

▸ **rm**(`path`, `options`, `callback`): `void`

Emulate rm -rf command in node

```js
import * as fs from "fs-extender";
fs.rm(path, (err) => {
    if (!err) {
        console.log("item removed with success.");
    }
});
```

##### Parameters

| Name       | Type                                | Description                             |
| :--------- | :---------------------------------- | :-------------------------------------- |
| `path`     | [`PathLike`][]                      | path to remove                          |
| `options`  | `undefined` \| [`RmOptions`][]      | [`RmOptions`][]                         |
| `callback` | (`err`: `ErrnoException`) => `void` | function to be called when rm completes |

##### Returns

`void`

▸ **rm**(`path`, `callback`): `void`

##### Parameters

| Name       | Type                                | Description                             |
| :--------- | :---------------------------------- | :-------------------------------------- |
| `path`     | [`PathLike`][]                      | path to remove                          |
| `callback` | (`err`: `ErrnoException`) => `void` | function to be called when rm completes |

##### Returns

`void`

---

### rmSync

▸ **rmSync**(`path`, `options?`): `void`

Emulate rm -rf command in node

```js
import * as fs from "fs-extender";
fs.rmSync(path);
console.log("item removed with success.");
```

##### Parameters

| Name       | Type            | Description     |
| :--------- | :-------------- | :-------------- |
| `path`     | [`PathLike`][]  | path to remove  |
| `options?` | [`RmOptions`][] | [`RmOptions`][] |

##### Returns

`void`

---

### Promises API

#### fsPromises.rm

▸ **fsPromises.rm**(`path`, `options?`): `void`

Emulate rm -rf command in node

```js
import * as fs from "fs-extender";
await fs.promises.rm(path);
console.log("item removed with success.");
```

##### Parameters

| Name       | Type            | Description     |
| :--------- | :-------------- | :-------------- |
| `path`     | [`PathLike`][]  | path to remove  |
| `options?` | [`RmOptions`][] | [`RmOptions`][] |

##### Returns

`void`

---

## Type Aliases

### RmOptions

Ƭ **RmOptions**: `Object`

Options for rm

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `force?` | `boolean` | When `true`, exceptions will be ignored if path does not exist. Default: `false`. |
| `maxRetries?` | `number` | If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or `EPERM` error is encountered, Node.js will retry the operation with a linear backoff wait of retryDelay milliseconds longer on each try. This option represents the number of retries. This option is ignored if the recursive option is not true. Default: `0`. |
| `noPreserveRoot?` | `boolean` | This options prevents accidentally removing the disc root item, default to `false`. If `true` will allow to remove all data in the drive, if no error occur |
| `recursive?` | `boolean` | If `true`, perform a recursive directory removal. In recursive mode, operations are retried on failure. Default: `false`. |
| `retryDelay?` | `number` | The amount of time in milliseconds to wait between retries. This option is ignored if the `recursive` option is not `true`. Default: `100`. |
| `stream?` | [`Readable`][] | if a stream is passed then it's possible to check the rm process with <pre>stream.on("data",(chunk:string)=>{<br /> const obj:[`RmStreamOutType`][] = JSON.parse(chunk); <br />});</pre> this doesn't work with [`rmSync`][] |

---

### RmStreamOutType

Ƭ **RmStreamOutType**: `Object`

##### Type declaration

| Name     | Type                    |
| :------- | :---------------------- |
| `error?` | `NodeJS.ErrnoException` |
| `item`   | `string` \| `Buffer`    |
| `type`   | `string`                |

---

[`pathlike`]: types.md#pathlike
[`rmoptions`]: #rmoptions
[`readable`]: https://github.com/nodejs/node/blob/master/doc/api/stream.md#readable-streams
[`rmstreamouttype`]: #rmstreamouttype
[`rmsync`]: #rmsync
