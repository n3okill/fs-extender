[fs-extender](../README.md) / Walk

# Walk Trough

## Table of Contents

-   [walk](#walk)
-   [walkSync](#walksync)
-   [Promises API](#promises-api)
    -   [fsPromises.walk](#fspromiseswalk)
-   [WalkAsyncFunction](#walkasyncfunction)
-   [WalkFunction](#walkfunction)
-   [WalkOptions](#walkoptions)

## Functions

### walk

▸ **walk**(`path`, `options`, `walkFunction`, `callback`): `void`

Walk trough directories

```js
import * as fs from "fs-extender";

let files = 0;
let dirs = 0;
fs.walk(
    path,
    (err, path, stats) => {
        if (stats.isDirectory()) {
            dirs++;
        } else {
            files++;
        }
    },
    (err) => {
        console.log(`files: ${files.length}`);
        console.log(`dirs: ${dirs.length}`);
    }
);
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs-PathLike |
| `options` | [`WalkOptions`][] | [`WalkOptions`][] |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |
| `callback` | (`err`: `null` \| `ErrnoException`) => `void` | function to be called at the end of the execution |

##### Returns

`void`

▸ **walk**(`path`, `walkFunction`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs-PathLike |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |
| `callback` | (`err`: `null` \| `ErrnoException`) => `void` | function to be called at the end of the execution |

##### Returns

`void`

---

### walkSync

▸ **walkSync**(`path`, `options`, `walkFunction`): `void`

Walk trough directories

```js
import * as fs from "fs-extender";

let files = 0;
let dirs = 0;
fs.walkSync(path, (err, path, stats) => {
    if (stats.isDirectory()) {
        dirs++;
    } else {
        files++;
    }
});
console.log(`files: ${files.length}`);
console.log(`dirs: ${dirs.length}`);
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs-PathLike |
| `options` | [`WalkOptions`][] | [`WalkOptions`][] |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |

##### Returns

`void`

▸ **walkSync**(`path`, `walkFunction`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] \| fs-PathLike |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |

##### Returns

`void`

---

### Promises API

#### fsPromises.walk

▸ **fsPromises.walk**(`path`, `options`, `walkFunction`): `void`

Walk trough directories

```js
import * as fs from "fs-extender";

let files = 0;
let dirs = 0;
await fs.promises.walk(path, (err, path, stats) => {
    if (stats.isDirectory()) {
        dirs++;
    } else {
        files++;
    }
});
console.log(`files: ${files.length}`);
console.log(`dirs: ${dirs.length}`);
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs-PathLike |
| `options` | [`WalkOptions`][] | options - [`WalkOptions`][] |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |

##### Returns

`void`

▸ **fsPromises.walk**(`path`, `walkFunction`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | fs-PathLike |
| `walkFunction` | [`WalkFunction`][] | function to be called for each item found in path - `(err: nodeJs.ErrNoException \| null, path: fs.PathLike [path to the current item], stats: fs.Stats [the stats of the current item])=> boolean` if walkFunction return `true` will stop the execution |

##### Returns

`void`

---

## Type Aliases

### WalkAsyncFunction

Ƭ **WalkAsyncFunction**: [`WalkFunction`][] \| (`err`: `NodeJS.ErrnoException` \| `null`, `path`: `string` \| `Buffer`, `stats`: [`Stats`][]) => `Promise`<`boolean` \| `void`\>

---

### WalkFunction

Ƭ **WalkFunction**: (`err`: `NodeJS.ErrnoException` \| `null`, `path`: `string` \| `Buffer`, `stats`: [`Stats`][]) => `boolean` \| `void`

##### Type declaration

▸ (`err`, `path`, `stats`): `boolean` \| `void`

##### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `err`   | `NodeJS.ErrnoException` \| `null` |
| `path`  | `string` \| `Buffer`              |
| `stats` | [`Stats`][]                       |

##### Returns

`boolean` \| `void`

---

### WalkOptions

Ƭ **WalkOptions**: `Object`

##### Type declaration

| Name           | Type      |
| :------------- | :-------- |
| `dereference?` | `boolean` |

---

[`pathlike`]: types.md#pathlike
[`walkoptions`]: #walkoptions
[`walkfunction`]: #walkfunction
[`stats`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fsstats
