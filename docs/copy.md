[fs-extender](../README.md) / Copy

# Copy Items

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [copy](#copy)
    -   [copySync](#copysync)
    -   [Promises API](#promises-api)
        -   [fsPromises.copy](#fspromisescopy)
-   [Type Aliases](#type-aliases)
    -   [CopyOptions](#copyoptions)
    -   [CopyOptionsErrorStream](#copyoptionserrorstream)
    -   [CopyStats](#copystats)
    -   [CopyStreamOutType](#copystreamouttype)

## Functions

### copy

▸ **copy**(`src`, `dst`, `options`, `callback`): `void`

Copy items in the file system async

```js
import * as fs from "fs-extender";

fs.copy(file1, dstFile1, (err, statistics) => {
    if (!err) {
        console.log("File copied with success");
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `src` | [`PathLike`][] | the path to be copied |
| `dst` | [`PathLike`][] | the destination path for the items |
| `options` | `undefined` \| [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterTypeAsync`][]<`string` \| `Buffer`\> | [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterTypeAsync`][]<`string` \| `Buffer`\> |
| `callback` | (`err`: `null` \| `ErrnoException`, `statistics`: [`CopyStats`][]) => `void` | the callback function that will be called after the copy is done |

##### Returns

`void`

▸ **copy**(`src`, `dst`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `src` | [`PathLike`][] | the path to be copied |
| `dst` | [`PathLike`][] | the destination path for the items |
| `callback` | (`err`: `null` \| `ErrnoException`, `statistics`: [`CopyStats`][]) => `void` | the callback function that will be called after the copy is done |

##### Returns

`void`

---

### copySync

▸ **copySync**(`src`, `dst`, `options?`): [`CopyStats`][]

Copy items in the file system async

```js
import * as fs from "fs-extender";

const statistics = fs.copySync(file1, dstFile1);
console.log("File copied with success");
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `src` | [`PathLike`][] | the path to be copied |
| `dst` | [`PathLike`][] | the destination path for the items |
| `options?` | [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterType`][]<`string` \| `Buffer`\> | [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterType`][]<`string` \| `Buffer`\> |

##### Returns

[`CopyStats`][] - Copied items statistics

---

### Promises API

#### fsPromises.copy

▸ **fsPromises.copy**(`src`, `dst`, `options?`): [`CopyStats`][]

Copy items in the file system async

```js
import * as fs from "fs-extender";

const statistics = await fs.promises.copy(file1, dstFile1);
console.log("File copied with success");
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `src` | [`PathLike`][] | the path to be copied |
| `dst` | [`PathLike`][] | the destination path for the items |
| `options` | `undefined` \| [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterTypeAsync`][]<`string` \| `Buffer`\> | [`CopyOptions`][]<`string` \| `Buffer`\> \| [`FindFilterTypeAsync`][]<`string` \| `Buffer`\> |

##### Returns

[`CopyStats`][] - Copied items statistics

---

## Type Aliases

### CopyOptions

Ƭ **CopyOptions**<`T`\>: `Object`

Options for copy

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `BUFFER_LENGTH?` | `number` | Size of the buffer to be used when copying files, default is `(64 * 1024)` |
| `depth?` | `number` | the final depth to copy items, default is `-1`, will copy everything |
| `dereference?` | `boolean` | Dereference link, default is `false` |
| `errorOnExist?` | `boolean` | return an error if file to be copied already exists when `overwrite` and `overwriteNewer` are `false` (default `true`) |
| `errors?` | `null` \| [`CopyOptionsErrorStream`][] \| [] | Options about what to do with occurring errors, if `null` will be temporarily saved in an array otherwise will be written to a stream defined by the user, default to `null` and will only be used if `stopOnError` is `false` |
| `filter?` | [`FindFilterTypeAsync`][]<`T`\> | Filter to be used in files, if set only items matching the filter will be copied. |
| `ignoreEmptyFolders?` | `boolean` | If `true` will ignore the copy of empty folder's default `false` |
| `overwrite?` | `boolean` | Overwrite destination items if they already exist, default to `false` |
| `overwriteNewer?` | `boolean` | Overwrite destination items only if items being copied are newer, default is `false` |
| `preserveTimestamps?` | `boolean` | When `true`, will set last modification and access times to the ones of the original source files. When `false`, timestamp behavior is OS-dependent. Default is `false`. |
| `stopOnError?` | `boolean` | Stop when an error is encountered, default is `true` |
| `stream?` | [`CopyStreamOutType`][] | if a `stream` is passed then it's possible to check the copy progress with <pre>stream.on("data",(chunk:string)=>{<br/> const obj:[`CopyStreamOutType`][] = JSON.parse(chunk);<br/> });</pre> this doesn't work with [`copySync`](#copysync) |

---

### CopyOptionsErrorStream

Ƭ **CopyOptionsErrorStream**: `Object`

Options for stream creation when stream is true

##### Type declaration

| Name         | Type                            |
| :----------- | :------------------------------ |
| `autoClose?` | `boolean`                       |
| `encoding?`  | `string`                        |
| `fd?`        | `number`                        |
| `flags?`     | `string`                        |
| `mode?`      | `number`                        |
| `path`       | [`PathLike`](types.md#pathlike) |
| `start?`     | `number`                        |

---

### CopyStats

Ƭ **CopyStats**: `Object`

Returned object after items copied

##### Type declaration

| Name                 | Type     | Description                                                                     |
| :------------------- | :------- | :------------------------------------------------------------------------------ |
| `copied`             | `Object` |
| `copied.directories` | `number` | Number of copied directories                                                    |
| `copied.files`       | `number` | Number of copied files                                                          |
| `copied.links`       | `number` | Number of copied links                                                          |
| `copied.size`        | `number` | Size copied                                                                     |
| `copied.time`        | `number` | Total time taken to copy                                                        |
| `errors`             | `number` | Array of errors that occurred while copying, only when `stopOnError` is `false` |
| `items`              | `number` | Number of items to copy at start                                                |
| `overwrited`         | `number` | Number of items overwrited, only if `overwrite` is `true`                       |
| `size`               | `number` | Total size of items to copy at start                                            |
| `skipped`            | `number` | Number of items skipped                                                         |

---

### CopyStreamOutType

Ƭ **CopyStreamOutType**: `Object`

##### Type declaration

| Name          | Type                                   | Description                                     |
| :------------ | :------------------------------------- | :---------------------------------------------- |
| `error?`      | `undefined` \| `NodeJS.ErrnoException` | Set only if there was an error copying the item |
| `eta`         | `number`                               | Estimated time to end                           |
| `item`        | `string` \| `Buffer`                   | Path to item to copy                            |
| `itemsCopied` | `number`                               | Number of items copied                          |
| `size`        | `number`                               | Size of item to copy                            |
| `timeTaken`   | `number`                               | Time taken until now                            |
| `totalItems`  | `number`                               | Total items to copy                             |
| `type`        | `string`                               | Type of item to copy                            |

---

[`pathlike`]: types.md#pathlike
[`copyoptions`]: #copyoptions
[`copystats`]: #copystats
[`copyoptionserrorstream`]: #copyoptionserrorstream
[`copystreamouttype`]: #copystreamouttype
[`findfiltertype`]: find.md#findfiltertype
[`findfiltertypeasync`]: find.md#findfiltertypeasync
