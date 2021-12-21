[fs-extender](../README.md) / List

# List Items

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [list](#list)
    -   [listSync](#listsync)
    -   [Promises API](#promises-api)
        -   [fsPromises.list](#fspromiseslist)
-   [Type Aliases](#type-aliases)
    -   [ListOptions](#listoptions)
    -   [ListResultType](#listresulttype)

## Functions

### list

▸ **list**(`path`, `options`, `callback`): `void`

Obtain the list of items under a directory and sub-directories asynchronously. Each item will be an object containing: {path: pathToItem, stat: itemStat}

```js
import * as fs from "fs-extender";
fs.list("c:/", (err, items) => {
    console.log(`${items.length} found`);
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to list items |
| `options` | [`ListOptions`][] & { `encoding`: `"buffer"` } | [`ListOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `string` \| `URL` | path to list items |
| `options` | `undefined` \| [`ListOptions`][] | [`ListOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`string`\>[]) => `void` | (err: Error \| null, items: Array<{path: string, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `Buffer` | path to list items |
| `options` | `undefined` \| [`ListOptions`][] | [`ListOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `string` \| `URL` | path to list items |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`string`\>[]) => `void` | (err: Error \| null, items: Array<{path: string, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `Buffer` | path to list items |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to list items |
| `options` | `undefined` \| [`ListOptions`][] | [`ListOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`string` \| `Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: string \| Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **list**(`path`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to list items |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`ListResultType`][]<`string` \| `Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: string \| Buffer, stats: fs.Stats}>) |

##### Returns

`void`

---

### listSync

▸ **listSync**(`path`, `options`): [`ListResultType`][]<`Buffer` | `string`\>[]

Obtain the list of items under a directory and sub-directories synchronously. Each item will be an object containing: {path: pathToItem, stat: itemStat}

```js
import * as fs from "fs-extender";
const items = fs.listSync("c:/");
console.log(`${items.length} found`);
```

##### Parameters

| Name      | Type                                           | Description        |
| :-------- | :--------------------------------------------- | :----------------- |
| `path`    | [`PathLike`][]                                 | path to list items |
| `options` | [`ListOptions`][] & { `encoding`: `"buffer"` } | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`Buffer`\>[]

`Array<{path: fs.PathLike, stats: fs.Stats}>`

▸ **listSync**(`path`, `options?`): [`ListResultType`][]<`string`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | `string` \| `URL` | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`string`\>[]

▸ **listSync**(`path`, `options?`): [`ListResultType`][]<`Buffer`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | `Buffer`          | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`Buffer`\>[]

▸ **listSync**(`path`, `options?`): [`ListResultType`][]<`string` \| `Buffer`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | [`PathLike`][]    | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`string` \| `Buffer`\>[]

---

### Promises API

#### fsPromises.list

▸ **fsPromises.list**(`path`, `options`): [`ListResultType`][]<`Buffer`\>[]

Obtain the list of items under a directory and sub-directories synchronously. Each item will be an object containing: {path: pathToItem, stat: itemStat}

```js
import * as fs from "fs-extender";
const items = await fs.promises.list("c:/");
console.log(`${items.length} found`);
```

##### Parameters

| Name      | Type                                           | Description        |
| :-------- | :--------------------------------------------- | :----------------- |
| `path`    | [`PathLike`][]                                 | path to list items |
| `options` | [`ListOptions`][] & { `encoding`: `"buffer"` } | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`Buffer`\>[]

`Array<{path: fs.PathLike, stats: fs.Stats}>`

▸ **fsPromises.list**(`path`, `options?`): [`ListResultType`][]<`string`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | `string` \| `URL` | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`string`\>[]

▸ **fsPromises.list**(`path`, `options?`): [`ListResultType`][]<`Buffer`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | `Buffer`          | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`Buffer`\>[]

▸ **fsPromises.list**(`path`, `options?`): [`ListResultType`][]<`string` \| `Buffer`\>[]

##### Parameters

| Name       | Type              | Description        |
| :--------- | :---------------- | :----------------- |
| `path`     | [`PathLike`][]    | path to list items |
| `options?` | [`ListOptions`][] | [`ListOptions`][]  |

##### Returns

[`ListResultType`][]<`string` \| `Buffer`\>[]

---

## Type Aliases

### ListOptions

Ƭ **ListOptions**: `Object`

Options used by list

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `depth?` | `number` | the final depth to list, default is `-1`, will list everything |
| `dereference?` | `boolean` | Dereference links, default is `false` |
| `encoding?` | [`BufferEncoding`][] \| `"buffer"` | The BufferEncoding to use with readdir default: `utf8` If path sent to list is a buffer this options will be set to `buffer` |
| `ignoreAccessError?` | `boolean` | Ignore error's when accessing to files or directories, default is `false` |

---

### ListResultType

Ƭ **ListResultType**<`T`\>: `Object`

Return an array of objects with fs.PahLike and fs.Stats

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Type declaration

| Name    | Type        |
| :------ | :---------- |
| `path`  | `T`         |
| `stats` | [`Stats`][] |

---

[`pathlike`]: types.md#pathlike
[`listoptions`]: #listoptions
[`listresulttype`]: #listresulttype
[`bufferencoding`]: types.md#bufferencoding
[`stats`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fsstats
