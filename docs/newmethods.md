[fs-extender](../README.md) / New Methods

# New Methods

## Table of Contents

-   [Table of Contents](#table-of-contents)
    -   [isEmpty](#isempty)
    -   [isEmptySync](#isemptysync)
    -   [statIsDirectory](#statisdirectory)
    -   [statIsDirectorySync](#statisdirectorysync)
    -   [statIsFile](#statisfile)
    -   [statIsFileSync](#statisfilesync)
    -   [statIsSymbolicLink](#statissymboliclink)
    -   [statIsSymbolicLinkSync](#statissymboliclinksync)
    -   [Promises API](#promises-api)
        -   [fsPromises.isEmpty](#fspromisesisempty)
        -   [fsPromises.statIsDirectory](#fspromisesstatisdirectory)
        -   [fsPromises.statIsFile](#fspromisesstatisfile)
        -   [fsPromises.statIsSymbolicLink](#fspromisesstatissymboliclink)

### isEmpty

▸ **isEmpty**(`path`, `options`, `callback`): `void`

Check if given path is empty, if it's a folder it will use [`readdir`][] and check the number of returing items, if it's another thing it will return the `size === 0`. Will throw any error that happens while checking

##### Parameters

| Name                   | Type                                                              |
| :--------------------- | :---------------------------------------------------------------- |
| `path`                 | [`PathLike`][]                                                    |
| `options`              | `Object`                                                          |
| `options.dereference?` | `boolean`                                                         |
| `callback`             | (`err`: `null` \| `ErrnoException`, `empty`: `boolean`) => `void` |

##### Returns

`void`

▸ **isEmpty**(`path`, `callback`): `void`

##### Parameters

| Name       | Type                                                              |
| :--------- | :---------------------------------------------------------------- |
| `path`     | [`PathLike`][]                                                    |
| `callback` | (`err`: `null` \| `ErrnoException`, `empty`: `boolean`) => `void` |

##### Returns

`void`

---

### isEmptySync

▸ **isEmptySync**(`path`, `options?`): `boolean`

Check if given path is empty, if it's a folder it will use [`readdir`][] and check the number of returing items, if it's another thing it will return the `size === 0`. Will throw any error that happens while checking

##### Parameters

| Name                   | Type           |
| :--------------------- | :------------- |
| `path`                 | [`PathLike`][] |
| `options`              | `Object`       |
| `options.dereference?` | `boolean`      |

##### Returns

`boolean`

---

### statIsDirectory

▸ **statIsDirectory**(`path`, `callback`): `void`

Check if the item is a directory

##### Parameters

| Name | Type |
| :-- | :-- |
| `path` | [`PathLike`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `isType`: `boolean`, `stats`: [`Stats`][] \| [`BigIntStats`][]) => `void` |

##### Returns

`void`

---

### statIsDirectorySync

▸ **statIsDirectorySync**(`path`): `boolean`

Check if path is a directory

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

### statIsFile

▸ **statIsFile**(`path`, `callback`): `void`

Check if path is a file

##### Parameters

| Name | Type |
| :-- | :-- |
| `path` | [`PathLike`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `isType`: `boolean`, `stats`: [`Stats`][] \| [`BigIntStats`][]) => `void` |

##### Returns

`void`

---

### statIsFileSync

▸ **statIsFileSync**(`path`): `boolean`

Check if path is a file

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

### statIsSymbolicLink

▸ **statIsSymbolicLink**(`path`, `callback`): `void`

Check if pat his a symbolik link

##### Parameters

| Name | Type |
| :-- | :-- |
| `path` | [`PathLike`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `isType`: `boolean`, `stats`: [`Stats`][] \| [`BigIntStats`][]) => `void` |

##### Returns

`void`

---

### statIsSymbolicLinkSync

▸ **statIsSymbolicLinkSync**(`path`): `boolean`

Check if path is a symbolik link

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

### Promises API

#### fsPromises.isEmpty

▸ **fsPromises.isEmpty**(`path`, `options?`): `boolean`

Check if given path is empty, if it's a folder it will use [`readdir`][] and check the number of returing items, if it's another thing it will return the `size === 0`. Will throw any error that happens while checking

##### Parameters

| Name                   | Type           |
| :--------------------- | :------------- |
| `path`                 | [`PathLike`][] |
| `options`              | `Object`       |
| `options.dereference?` | `boolean`      |

##### Returns

`boolean`

---

#### fsPromises.statIsDirectory

▸ **fsPromises.statIsDirectory**(`path`): `boolean`

Check if path is a directory

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

#### fsPromises.statIsFile

▸ **fsPromises.statIsFile**(`path`): `boolean`

Check if path is a file

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

#### fsPromises.statIsSymbolicLink

▸ **fsPromises.statIsSymbolicLink**(`path`): `boolean`

Check if path is a symbolik link

##### Parameters

| Name   | Type           |
| :----- | :------------- |
| `path` | [`PathLike`][] |

##### Returns

`boolean`

---

[`stats`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fsstats
[`bigintstats`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#class-fsstats
[`pathlike`]: types.md#pathlike
[`readdir`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#fsreaddirpath-options-callback
