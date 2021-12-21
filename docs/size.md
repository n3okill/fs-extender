[fs-extender](../README.md) / Size

# Size of Items

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [size](#size)
    -   [sizeSync](#sizesync)
    -   [Promises API](#promises-api)
        -   [fsPromises.size](#fspromisessize)
-   [Type Aliases](#type-aliases)
    -   [SizeOptions](#sizeoptions)
    -   [SizeStats](#sizestats)

## Functions

### size

▸ **size**(`path`, `options`, `callback`): `void`

Check the size of an item, if `path` is a directory then will list all the items and return their size

```js
import * as fs from "fs-extender";
fs.size(path, (err, sizeStats) => {
    console.log(sizeStats);
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs.PathLike |
| `options` | [`SizeOptions`][] | [`SizeOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `stats`: [`SizeStats`][]) => `void` | (err: Error \| null, result: SizeStats) |

##### Returns

`void`

▸ **size**(`path`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs.PathLike |
| `callback` | (`err`: `null` \| `ErrnoException`, `stats`: [`SizeStats`][]) => `void` | (err: Error \| null, result: SizeStats) |

##### Returns

`void`

---

### sizeSync

▸ **sizeSync**(`path`, `options?`): [`SizeStats`][]

Check the size of an item, if `path` is a directory then will list all the items and return their size

```js
import * as fs from "fs-extender";
const sizeStats = fs.sizeSync(path);
console.log(sizeStats);
```

##### Parameters

| Name       | Type              | Description       |
| :--------- | :---------------- | :---------------- |
| `path`     | [`PathLike`][]    | fs.PathLike       |
| `options?` | [`SizeOptions`][] | [`SizeOptions`][] |

##### Returns

[`SizeStats`][]

---

### Promises API

#### fsPromises.size

▸ **fsPromises.size**(`path`, `options?`): [`SizeStats`][]

Check the size of an item, if `path` is a directory then will list all the items and return their size

```js
import * as fs from "fs-extender";
const sizeStats = await fs.promises.size(path);
console.log(sizeStats);
```

##### Parameters

| Name       | Type              | Description       |
| :--------- | :---------------- | :---------------- |
| `path`     | [`PathLike`][]    | fs.PathLike       |
| `options?` | [`SizeOptions`][] | [`SizeOptions`][] |

##### Returns

[`SizeStats`][]

---

## Type Aliases

### SizeOptions

Ƭ **SizeOptions**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `depth?` | `number` | the final depth to list, default is -1, will list everything |
| `dereference?` | `boolean` | Dereference links, default is false |
| `enconding?` | [`BufferEncoding`][] \| `"buffer"` | - |
| `ignoreAccessError?` | `boolean` | Ignore error's when accessing to files or directories, default is false |

---

### SizeStats

Ƭ **SizeStats**: `Object`

##### Type declaration

| Name               | Type     |
| :----------------- | :------- |
| `blockDevices`     | `number` |
| `characterDevices` | `number` |
| `directories`      | `number` |
| `fifos`            | `number` |
| `files`            | `number` |
| `filesSize`        | `number` |
| `links`            | `number` |
| `sockets`          | `number` |
| `totalItems`       | `number` |
| `totalSize`        | `number` |

---

[`pathlike`]: types.md#pathlike
[`sizeoptions`]: #sizeoptions
[`sizestats`]: #sizestats
[`bufferencoding`]: types.md#bufferencoding
