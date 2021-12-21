[fs-extender](../README.md) / Find

# Find Items

## Table of Contents

-   [find](#find)
-   [findSync](#findsync)
-   [Promises API](#promises-api)
    -   [fsPromises.find](#fspromisesfind)
-   [FindFilterFunction](#findfilterfunction)
-   [FindFilterFunctionAsync](#findfilterfunctionasync)
-   [FindFilterType](#findfiltertype)
-   [FindFilterTypeAsync](#findfiltertypeasync)
-   [FindOptions](#findoptions)
-   [FindOptionsAsync](#findoptionsasync)
-   [FindResultType](#findresulttype)

## Functions

### find

▸ **find**(`path`, `options`, `callback`): `void`

Obtain the list of items under a directory and sub-directories asynchronously applying a filter

```js
//List all files under 'c:/'
import * as fs from "fs-extender";
fs.find(
    "c:/",
    (path: fs.PathLike, stats: fs.Stats) => stats.isFile(),
    (err: NodeJs.ErroNoException | null, items: Array<{ path: fs.PathLike, stats: fs.Stats }>) => {
        console.log(items.length);
    }
);
```

Each item will be an object containing: {path: pathToItem, stat: fs.Stats}

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `options` | { `encoding`: `"buffer"` } & [`FindFilterTypeAsync`][]<`Buffer`\> \| [`FindOptionsAsync`][]<`Buffer`\> | [`FindFilterTypeAsync`][], [`FindOptionsAsync`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `result`: [`FindResultType`][]<`Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **find**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `string` \| `URL` | path to search for items |
| `options` | `undefined` \| [`FindFilterTypeAsync`][]<`string`\> \| [`FindOptionsAsync`][]<`string`\> | [`FindFilterTypeAsync`][], [`FindOptionsAsync`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `result`: [`FindResultType`][]<`string`\>[]) => `void` | (err: Error \| null, items: Array<{path: string, stats: fs.Stats}>) |

##### Returns

`void`

▸ **find**(`path`, `options`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | `Buffer` | path to search for items |
| `options` | `undefined` \| [`FindFilterTypeAsync`][]<`Buffer`\> \| [`FindOptionsAsync`][]<`Buffer`\> | [`FindFilterTypeAsync`][], [`FindOptionsAsync`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `result`: [`FindResultType`][]<`Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: Buffer, stats: fs.Stats}>) |

##### Returns

`void`

▸ **find**(`path`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `callback` | (`err`: `null` \| `ErrnoException`, `items`: [`FindResultType`][]<`string` \| `Buffer`\>[]) => `void` | (err: Error \| null, items: Array<{path: string \| Buffer, stats: fs.Stats}>) |

##### Returns

`void`

---

### findSync

▸ **findSync**(`path`, `options`): [`FindResultType`][]<`Buffer`\>[]

Obtain the list of items under a directory and sub-directories asynchronously applying a filter

```js
//List all files under 'c:/'
import * as fs from "fs-extender";
const items = fs.findSync("c:/", (path: fs.PathLike, stats: fs.Stats) => {
    return stats.isFile();
});
```

Each item will be an object containing: {path: pathToItem, stat: itemStat}

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `options` | { `encoding`: `"buffer"` } & [`FindFilterType`][]<`Buffer`\> \| [`FindOptions`][]<`Buffer`\> | [`FindFilterType`][], [`FindOptions`][] |

##### Returns

[`FindResultType`][]<`Buffer`\>[]

Array<{path: Buffer, stats: fs.Stats}>

▸ **findSync**(`path`, `options?`): [`FindResultType`][]<`string` \| `Buffer`\>[]

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `options?` | [`FindOptions`][]<`string` \| `Buffer`\> \| [`FindFilterType`][]<`string` \| `Buffer`\> | [`FindFilterType`][], [`FindOptions`][] |

##### Returns

[`FindResultType`][]<`string` \| `Buffer`\>[]

---

### Promises API

#### fsPromises.find

▸ **fsPromises.find**(`path`, `options`): [`FindResultType`][]<`Buffer`\>[]

Obtain the list of items under a directory and sub-directories asynchronously applying a filter

```js
//List all files under 'c:/'
import * as fs from "fs-extender";
const items = await fs.promises.find("c:/", (path: fs.PathLike, stats: fs.Stats) => {
    return stats.isFile();
});
```

Each item will be an object containing: {path: pathToItem, stat: fs.Stats}

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `options` | { `encoding`: `"buffer"` } & [`FindFilterTypeAsync`][]<`Buffer`\> \| [`FindOptionsAsync`][]<`Buffer`\> | [`FindFilterTypeAsync`][], [`FindOptionsAsync`][] |

##### Returns

[`FindResultType`][]<`Buffer`\>[]

Array<{path: Buffer, stats: fs.Stats}>

▸ **fsPromises.find**(`path`, `options?`): [`FindFilterTypeAsync`][]<`string` \| `Buffer`\>[]

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to search for items |
| `options?` | [`FindOptionsAsync`][]<`string` \| `Buffer`\> \| [`FindFilterTypeAsync`][]<`string` \| `Buffer`\> | [`FindFilterTypeAsync`][], [`FindOptionsAsync`][] |

##### Returns

[`FindResultType`][]<`string` \| `Buffer`\>[]

---

## Type Aliases

### FindFilterFunction

Ƭ **FindFilterFunction**<`T`\>: (`path`: `T`, `stats`: [`Stats`][]) => `boolean`

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Type declaration

▸ (`path`, `stats`): `boolean`

##### Parameters

| Name    | Type        |
| :------ | :---------- |
| `path`  | `T`         |
| `stats` | [`Stats`][] |

##### Returns

`boolean`

---

### FindFilterFunctionAsync

Ƭ **FindFilterFunctionAsync**<`T`\>: (`path`: `T`, `stats`: [`Stats`][]) => `boolean` \| `Promise`<`boolean`\>

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Type declaration

▸ (`path`, `stats`): `boolean` \| `Promise`<`boolean`\>

##### Parameters

| Name    | Type        |
| :------ | :---------- |
| `path`  | `T`         |
| `stats` | [`Stats`][] |

##### Returns

`boolean` \| `Promise`<`boolean`\>

---

### FindFilterType

Ƭ **FindFilterType**<`T`\>: `RegExp` \| [`FindFilterFunction`][]<`T`\>

Definition for filter

##### Type parameters

| Name |
| :--- |
| `T`  |

---

### FindFilterTypeAsync

Ƭ **FindFilterTypeAsync**<`T`\>: `RegExp` \| [`FindFilterFunctionAsync`][]<`T`\>

##### Type parameters

| Name |
| :--- |
| `T`  |

---

### FindOptions

Ƭ **FindOptions**<`T`\>: [`ListOptions`][] & { `filter?`: [`FindFilterType`][]<`T`\> }

Options used by find sync

##### Type parameters

| Name |
| :--- |
| `T`  |

---

### FindOptionsAsync

Ƭ **FindOptionsAsync**<`T`\>: [`ListOptions`][] & { `filter?`: [`FindFilterTypeAsync`][]<`T`\> }

Options used by find async

##### Type parameters

| Name |
| :--- |
| `T`  |

---

### FindResultType

Ƭ **FindResultType**<`T`\>: [`ListResultType`][]<`T`\>

Return an object with T and fs.Stats - {path: T, stats: fs.Stats}

##### Type parameters

| Name |
| :--- |
| `T`  |

---

[`pathlike`]: types.md#pathlike
[`findfiltertypeasync`]: #findfiltertypeasync
[`findoptionsasync`]: #findoptionsasync
[`findresulttype`]: #findresulttype
[`findfiltertype`]: #findfiltertype
[`findoptions`]: #findoptions
[`stats`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fsstats
[`findfilterfunction`]: #findfilterfunction
[`findfilterfunctionasync`]: #findfilterfunctionasync
[`listoptions`]: list.md#listoptions
[`listresulttype`]: list.md#listresulttype
