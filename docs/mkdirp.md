[fs-extender](../README.md) / Mkdirp

# Create Directories

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [mkdirp](#mkdirp)
    -   [mkdirpSync](#mkdirpsync)
    -   [Promises API](#promises-api)
        -   [fsPromises.mkdirp](#fspromisesmkdirp)
-   [Type Aliases](#type-aliases)
    -   [MkdirpOptions](#mkdirpoptions)

## Functions

### mkdirp

▸ **mkdirp**(`path`, `options`, `callback`): `void`

Asynchronously creates a directory.

The callback is given a possible exception and, the last directory paths created, `(err[, path])`.`path` can still be `undefined`, if no directory was created.

The optional `options` argument can be an integer specifying `mode` (permission and sticky bits), or an object with a `mode` property and a optional `fs` property.

```js
import * as fs from "fs-extender";

// Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
fs.mkdirp("/tmp/a/apple", (err) => {
    if (err) throw err;
});
```

```js
fs.mkdirp("/path/{to1,to2}/{dir1,dir2}", (err) => {
    if (err) throw err;
});
```

will create the directories: /path/to1/dir1 /path/to1/dir2 /path/to2/dir1 /path/to2/dir2

On Windows, using `fs.mkdirp()` on the root directory even with recursion will result in an error:

```js
import { mkdirp } from "fs-extender";

fs.mkdir("/", (err) => {
    // => [Error: EPERM: operation not permitted, mkdir 'C:\']
});
```

See the POSIX [`mkdir(2)`][] documentation for more details.

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] \| [`PathLike`][][] | path(s) of directory(ies) to create. If a URL is provided, it must use the `file:` protocol. |
| `options` | `undefined` \| `null` \| [`Mode`][] \| [`MkdirpOptions`][] | [`MkdirpOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `path?`: [`PathLike`][] \| [`PathLike`][][]) => `void` | (err: Error \| null, paths: fs.PathLike \| fs.PathLike[]) |

##### Returns

`void`

▸ **mkdirp**(`path`, `callback`): `void`

Asynchronous mkdir(2) - create a directory with a mode of `0o777`.

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] \| [`PathLike`][][] | path(s) of directory(ies) to create. If a URL is provided, it must use the `file:` protocol. |
| `callback` | (`err`: `null` \| `ErrnoException`, `path?`: [`PathLike`][] \| [`PathLike`][][]) => `void` | (err: Error \| null, paths: fs.PathLike \| fs.PathLike[]) |

##### Returns

`void`

---

### mkdirpSync

▸ **mkdirpSync**(`path`, `options?`): [`PathLike`][] \| [`PathLike`][][]

Synchronously creates a directory.

Will return all the paths created

The optional `options` argument can be an integer specifying `mode` (permission and sticky bits), or an object with a `mode` property and a optional `fs` property.

```js
import * as fs from "fs-extender";

// Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
fs.mkdirpSync("/tmp/a/apple");
```

```js
fs.mkdirpSync("/path/{to1,to2}/{dir1,dir2}");
```

will create the directories: /path/to1/dir1 /path/to1/dir2 /path/to2/dir1 /path/to2/dir2

On Windows, using `fs.mkdirpSync()` on the root directory even with recursion will result in an error:

```js
fs.mkdirpSync("/");
// => [Error: EPERM: operation not permitted, mkdir 'C:\']
```

See the POSIX [`mkdir(2)`][] documentation for more details.

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] \| [`PathLike`][][] | path(s) of directory(ies) to create. If a URL is provided, it must use the `file:` protocol. |
| `options?` | `null` \| [`Mode`][] \| [`MkdirpOptions`][] | [`MkdirpOptions`][] |

##### Returns

[`PathLike`][] \| [`PathLike`][][]

---

### Promises API

#### fsPromises.mkdirp

▸ **fsPromises.mkdirp**(`path`, `options?`): [`PathLike`][] \| [`PathLike`][][]

Synchronously creates a directory.

Will return all the paths created

The optional `options` argument can be an integer specifying `mode` (permission and sticky bits), or an object with a `mode` property and a optional `fs` property.

```js
import * as fs from "fs-extender";

// Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
await fs.promises.mkdirp("/tmp/a/apple");
```

```js
await fs.promises.mkdirp("/path/{to1,to2}/{dir1,dir2}");
```

will create the directories: /path/to1/dir1 /path/to1/dir2 /path/to2/dir1 /path/to2/dir2

On Windows, using `fs.promises.mkdirp()` on the root directory even with recursion will result in an error:

```js
await fs.promises.mkdirp("/");
// => [Error: EPERM: operation not permitted, mkdir 'C:\']
```

See the POSIX [`mkdir(2)`][] documentation for more details.

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] \| [`PathLike`][][] | path(s) of directory(ies) to create. If a URL is provided, it must use the `file:` protocol. |
| `options?` | `null` \| [`Mode`][] \| [`MkdirpOptions`][] | [`MkdirpOptions`][] |

##### Returns

[`PathLike`][] \| [`PathLike`][][]

---

## Type Aliases

### MkdirpOptions

Ƭ **MkdirpOptions**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `mode?` | [`Mode`][] | A file mode. If a string is passed, it is parsed as an octal integer. If not specified default is `0o777` |

---

[`pathlike`]: types.md#pathlike
[`mode`]: https://github.com/nodejs/node/blob/master/doc/api/fs.md#file-modes
[`mkdir(2)`]: http://man7.org/linux/man-pages/man2/mkdir.2.html
[`mkdirpoptions`]: #mkdirpoptions
