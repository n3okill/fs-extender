[fs-extender](../README.md) / Compare

# Compare

## Table of contents

-   [Table of contents](#table-of-contents)
-   [Functions](#functions)
    -   [dirByte](#dirbyte)
    -   [dirByteSync](#dirbytesync)
    -   [dirHash](#dirhash)
    -   [dirHashSync](#dirhashsync)
    -   [filesByte](#filesbyte)
    -   [filesByteSync](#filesbytesync)
    -   [filesHash](#fileshash)
    -   [filesHashSync](#fileshashsync)
    -   [Promises API](#promises-api)
        -   [fsPromises.dirByte](#fspromisesdirbyte)
        -   [fsPromises.dirHash](#fspromisesdirhash)
        -   [fsPromises.filesByte](#fspromisesfilesbyte)
        -   [fsPromises.filesHash](#fspromisesfileshash)
-   [Type Aliases](#type-aliases)
    -   [CompareOptionsByte](#compareoptionsbyte)
    -   [CompareOptionsHash](#compareoptionshash)

## Functions

### dirByte

▸ **dirByte**(`path1`, `path2`, `options`, `callback`): `void`

Compare two directories in a byte-to-byte file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
fs.dirByte(dir1, dir2, (err, areEqual) => {
    if (areEqual) {
        console.log("Are equal");
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first directory |
| `path2` | [`PathLike`][] | the path to the second directory |
| `options` | `undefined` \| [`CompareOptionsByte`][] | [`CompareOptionsByte`][] |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

▸ **dirByte**(`path1`, `path2`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first directory |
| `path2` | [`PathLike`][] | the path to the second directory |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

---

### dirByteSync

▸ **dirByteSync**(`path1`, `path2`, `options?`): `boolean`

Compare two directories in a byte-to-byte file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
const areEqual = fs.dirByteSync(dir1, dir2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                      |
| :--------- | :----------------------- | :------------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first directory  |
| `path2`    | [`PathLike`][]           | the path to the second directory |
| `options?` | [`CompareOptionsByte`][] | [`CompareOptionsByte`][]         |

##### Returns

`boolean`

---

### dirHash

▸ **dirHash**(`path1`, `path2`, `options`, `callback`): `void`

Compare two directories with a hash file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
fs.dirHash(dir1, dir2, (err, areEqual) => {
    if (areEqual) {
        console.log("Are equal");
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first file |
| `path2` | [`PathLike`][] | the path to the second file |
| `options` | `undefined` \| [`CompareOptionsHash`][] | [`CompareOptionsHash`][] |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

▸ **dirHash**(`path1`, `path2`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first directory |
| `path2` | [`PathLike`][] | the path to the second directory |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

---

### dirHashSync

▸ **dirHashSync**(`path1`, `path2`, `options?`): `boolean`

Compare two directories with a hash file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
const areEqual = fs.dirHashSync(dir1, dir2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsHash`][] | [`CompareOptionsHash`][]    |

##### Returns

`boolean`

---

### filesByte

▸ **filesByte**(`path1`, `path2`, `options`, `callback`): `void`

Compare two files in a byte-to-byte comparison

```js
import * as fs from "fs-extender";
fs.filesByte(file1, file2, (err, areEqual) => {
    if (areEqual) {
        console.log("Are equal");
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first file |
| `path2` | [`PathLike`][] | the path to the second file |
| `options` | `undefined` \| [`CompareOptionsByte`][] | [`CompareOptionsByte`][] |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

▸ **filesByte**(`path1`, `path2`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first file |
| `path2` | [`PathLike`][] | the path to the second file |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

---

### filesByteSync

▸ **filesByteSync**(`path1`, `path2`, `options?`): `boolean`

Compare two files in a byte-to-byte comparison

```js
import * as fs from "fs-extender";
const areEqual = fs.filesByteSync(file1, file2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsByte`][] | [`CompareOptionsByte`][]    |

##### Returns

`boolean`

---

### filesHash

▸ **filesHash**(`path1`, `path2`, `options`, `callback`): `void`

Compare two files in a hash comparison

```js
import * as fs from "fs-extender";
fs.filesHash(file1, file2, (err, areEqual) => {
    if (areEqual) {
        console.log("Are equal");
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first file |
| `path2` | [`PathLike`][] | the path to the second file |
| `options` | `undefined` \| [`CompareOptionsHash`][] | [`CompareOptionsHash`][] |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

▸ **filesHash**(`path1`, `path2`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path1` | [`PathLike`][] | the path to the first file |
| `path2` | [`PathLike`][] | the path to the second file |
| `callback` | (`err`: `ErrnoException`, `equal`: `boolean`) => `void` | the callback function that will be called after the comparison is done |

##### Returns

`void`

---

### filesHashSync

▸ **filesHashSync**(`path1`, `path2`, `options?`): `boolean`

Compare two files in a hash comparison

```js
import * as fs from "fs-extender";
const areEqual = fs.filesHashSync(file1, file2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsHash`][] | [`CompareOptionsHash`][]    |

##### Returns

`boolean`

---

### Promises API

#### fsPromises.dirByte

▸ **fsPromises.dirByte**(`path1`, `path2`, `options?`): `boolean`

Compare two directories in a byte-to-byte file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
const areEqual = await fs.promises.dirByte(dir1, dir2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                      |
| :--------- | :----------------------- | :------------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first directory  |
| `path2`    | [`PathLike`][]           | the path to the second directory |
| `options?` | [`CompareOptionsByte`][] | [`CompareOptionsByte`][]         |

##### Returns

`boolean`

---

#### fsPromises.dirHash

▸ **fsPromises.dirHash**(`path1`, `path2`, `options?`): `boolean`

Compare two directories with a hash file comparison Note: This method will compare all sub-folder's

```js
import * as fs from "fs-extender";
const areEqual = await fs.promises.dirHash(dir1, dir2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsHash`][] | [`CompareOptionsHash`][]    |

##### Returns

`boolean`

---

#### fsPromises.filesByte

▸ **fsPromises.filesByte**(`path1`, `path2`, `options?`): `boolean`

Compare two files in a byte-to-byte comparison

```js
import * as fs from "fs-extender";
const areEqual = await fs.promises.filesByte(file1, file2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsByte`][] | [`CompareOptionsByte`][]    |

##### Returns

`boolean`

---

#### fsPromises.filesHash

▸ **fsPromises.filesHash**(`path1`, `path2`, `options?`): `boolean`

Compare two files in a hash comparison

```js
import * as fs from "fs-extender";
const areEqual = await fs.promises.filesHash(file1, file2);
if (areEqual) {
    console.log("Are equal");
}
```

##### Parameters

| Name       | Type                     | Description                 |
| :--------- | :----------------------- | :-------------------------- |
| `path1`    | [`PathLike`][]           | the path to the first file  |
| `path2`    | [`PathLike`][]           | the path to the second file |
| `options?` | [`CompareOptionsHash`][] | [`CompareOptionsHash`][]    |

##### Returns

`boolean`

---

## Type Aliases

### CompareOptionsByte

Ƭ **CompareOptionsByte**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `chunkSize?` | `number` | Size to use when comparing files, default is 8192 |
| `dereference?` | `boolean` | Dereference links, default is false |
| `ignoreError?` | `boolean` | If true will ignore error's when trying to compare a path that is not a directory, default: false |

---

### CompareOptionsHash

Ƭ **CompareOptionsHash**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `dereference?` | `boolean` | Dereference links, default is false |
| `encoding?` | `BufferEncoding` | Type of encoding to use for compare, default is 'hex' |
| `hash?` | `string` | Type of hash to use for compare, default is 'sha512' |
| `ignoreError?` | `boolean` | If true will ignore error's when trying to compare a path that is not a directory, default: false |

---

[`pathlike`]: types.md#pathlike
[`compareoptionsbyte`]: #compareoptionsbyte
[`compareoptionshash`]: #compareoptionshash
