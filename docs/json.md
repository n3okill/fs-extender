[fs-extender](../README.md) / Json

# Json

## Table of Contents

-   [Table of Contents](#table-of-contents)
-   [Functions](#functions)
    -   [ensureJsonFile](#ensurejsonfile)
    -   [ensureJsonFileSync](#ensurejsonfilesync)
    -   [readJsonFile](#readjsonfile)
    -   [readJsonFileSync](#readjsonfilesync)
    -   [readJsonLines](#readjsonlines)
    -   [writeJsonFile](#writejsonfile)
    -   [writeJsonFileSync](#writejsonfilesync)
    -   [Promises API](#promises-api)
        -   [fsPromises.ensureJsonFile](#fspromisesensurejsonfile)
        -   [fsPromises.readJsonFile](#fspromisesreadjsonfile)
        -   [fsPromises.readJsonLines](#fspromisesreadjsonlines)
        -   [fsPromises.writeJsonFile](#fspromiseswritejsonfile)
-   [Type Aliases](#type-aliases)
    -   [ReplacerType](#replacertype)
    -   [ReadJsonOptions](#readjsonoptions)
    -   [ReadJsonLineOptions](#readjsonlineoptions)
    -   [ReadJsonLinesFunction](#readjsonlinesfunction)
    -   [ReviverType](#revivertype)
    -   [WriteJsonOptions](#writejsonoptions)

## Functions

### ensureJsonFile

▸ **ensureJsonFile**(`path`, `obj`, `options`, `callback`): `void`

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file making sure the file is created even if the path doesn't exist. This works as a mix between [writeJsonFile][] and [ensureFile][]

```js
import * as fs from "fs-extender";
fs.ensureJsonFile(path, { name: "Jonh Smith", age: 1001 }, (err) => {
    if (!err) {
        console.log(`File writed with success`);
    }
});
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `obj` | `unknown` | object to write to file as json string |
| `options` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `path`: [`PathLike`][]) => `void` | (err: NodeJs.ErroNoException \| null, path: fs.PathLike) |

##### Returns

`void`

▸ **ensureJsonFile**(`path`, `obj`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `obj` | `unknown` | object to write to file as json string |
| `callback` | (`err`: `null` \| `ErrnoException`, `path`: [`PathLike`][]) => `void` | (err: NodeJs.ErroNoException \| null, path: fs.PathLike) |

##### Returns

`void`

---

### ensureJsonFileSync

▸ **ensureJsonFileSync**(`path`, `obj`, `options?`): [`PathLike`][]

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file making sure the file is created even if the path doesn't exist This works as a mix between [writeJsonFileSync][] and [ensureFileSync][]

```js
import * as fs from "fs-extender";
fs.ensureJsonFileSync(path, { name: "Jonh Smith", age: 1001 });
console.log(`File writed with success`);
```

##### Parameters

| Name       | Type                   | Description                            |
| :--------- | :--------------------- | :------------------------------------- |
| `path`     | [`PathLike`][]         | path to file                           |
| `obj`      | `unknown`              | object to write to file as json string |
| `options?` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][]                 |

##### Returns

[`PathLike`][]

`fs.PathLike`

---

### readJsonFile

▸ **readJsonFile**<`T`\>(`path`, `options`, `callback`): `void`

Read json file and transform's it into an object

```js
import * as fs from "fs-extender";
fs.readJsonFile(path, (err, obj) => {
    if (!err) {
        console.log(`File read with success. Object: ${obj}`);
    }
});
```

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `options` | [`ReadJsonOptions`][] | [`ReadJsonOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `res`: `T`) => `void` | `(err: NodeJs.ErrNoException \| null, res: any)` |

##### Returns

`void`

▸ **readJsonFile**<`T`\>(`path`, `callback`): `void`

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `callback` | (`err`: `null` \| `ErrnoException`, `res`: `T`) => `void` | `(err: NodeJs.ErrNoException \| null, res: any)` |

##### Returns

`void`

---

### readJsonFileSync

▸ **readJsonFileSync**<`T`\>(`path`, `options?`): `T`

Read json file and transform's it into an object

```js
import * as fs from "fs-extender";
const obj = fs.readJsonFileSync(path);
console.log(`File read with success. Object: ${obj}`);
```

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name       | Type                  | Description           |
| :--------- | :-------------------- | :-------------------- |
| `path`     | [`PathLike`][]        | path to file          |
| `options?` | [`ReadJsonOptions`][] | [`ReadJsonOptions`][] |

##### Returns

`T`

`any`

---

### readJsonLines

▸ **readJsonLines**(`path`, `options`, `fn`, `callback`): `void`

Read json file and transform's it into an object

```js
import * as fs from "fs-extender";
const lines = [];
fs.readJsonLines(
    path,
    (obj) => {
        lines.push(obj);
        return true;
    },
    (err) => {
        if (!err) {
            console.log(`File read with success. Lines: ${lines.length}`);
        }
    }
);
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `options` | [`ReadJsonLineOptions`][] | [`ReadJsonLineOptions`][] |
| `fn` | [`ReadJsonLinesFunction`][] | function executed for each line readed: `(obj: any) => boolean \| Promise<boolean>` if the function return false the execution will be stopped. |
| `callback` | (`err`: `null` \| `ErrnoException`) => `void` | `(err: NodeJs.ErrNoException \| null, res: any)` |

##### Returns

`void`

▸ **readJsonLines**(`path`, `fn`, `callback`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- | --- |
| `path` | [`PathLike`][] |  | path to file |
| `fn` | [`ReadJsonLinesFunction`][] | function executed for each line readed: `(obj: any) => boolean \| Promise<boolean>` if the function return false the execution will be stopped. |
| `callback` | (`err`: `null` \| `ErrnoException`) => `void` | `(err: NodeJs.ErrNoException \| null, res: any)` |

##### Returns

`void`

---

### writeJsonFile

▸ **writeJsonFile**<`T`\>(`path`, `obj`, `options`, `callback`): `void`

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file

```js
import * as fs from "fs-extender";
fs.writeJsonFile(path, { name: "Jonh Smith", age: 1001 }, (err) => {
    if (!err) {
        console.log(`File writed with success`);
    }
});
```

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `obj` | `T` | object to write to file as json string |
| `options` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][] |
| `callback` | (`err`: `null` \| `ErrnoException`, `path`: [`PathLike`][]) => `void` | (err: NodeJs.ErroNoException \| null, path: fs.PathLike) |

##### Returns

`void`

▸ **writeJsonFile**<`T`\>(`path`, `obj`, `callback`): `void`

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `obj` | `T` | object to write to file as json string |
| `callback` | (`err`: `null` \| `ErrnoException`, `path`: [`PathLike`][]) => `void` | (err: NodeJs.ErroNoException \| null, path: fs.PathLike) |

##### Returns

`void`

---

### writeJsonFileSync

▸ **writeJsonFileSync**(`path`, `obj`, `options?`): [`PathLike`][]

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file

```js
import * as fs from "fs-extender";
fs.writeJsonFileSync(path, { name: "Jonh Smith", age: 1001 });
console.log(`File writed with success`);
```

##### Parameters

| Name       | Type                   | Description                            |
| :--------- | :--------------------- | :------------------------------------- |
| `path`     | [`PathLike`][]         | path to file                           |
| `obj`      | `unknown`              | object to write to file as json string |
| `options?` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][]                 |

##### Returns

[`PathLike`][]

---

### Promises API

#### fsPromises.ensureJsonFile

▸ **fsPromises.ensureJsonFile**(`path`, `obj`, `options`): `void`

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file making sure the file is created even if the path doesn't exist This works as a mix between [fsPromises.writeJsonFile][] and [fsPromises.ensureFile][]

```js
import * as fs from "fs-extender";
await fs.promises.ensureJsonFile(path, { name: "Jonh Smith", age: 1001 });
console.log(`File writed with success`);
```

##### Parameters

| Name       | Type                   | Description                            |
| :--------- | :--------------------- | :------------------------------------- |
| `path`     | [`PathLike`][]         | path to file                           |
| `obj`      | `unknown`              | object to write to file as json string |
| `options?` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][]                 |

##### Returns

`void`

---

#### fsPromises.readJsonFile

▸ **fsPromises.readJsonFile**<`T`\>(`path`, `options`): `void`

Read json file and transform's it into an object

```js
import * as fs from "fs-extender";
await fs.promises.readJsonFile(path);
console.log(`File read with success. Object: ${obj}`);
```

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name      | Type                  | Description           |
| :-------- | :-------------------- | :-------------------- |
| `path`    | [`PathLike`][]        | path to file          |
| `options` | [`ReadJsonOptions`][] | [`ReadJsonOptions`][] |

##### Returns

`void`

---

#### fsPromises.readJsonLines

▸ **fsPromises.readJsonLines**(`path`, `options`, `fn`): `void`

Read json file and transform's it into an object

```js
import * as fs from "fs-extender";
const lines = [];
await fs.promises.readJsonLines(path, (obj) => {
    lines.push(obj);
    return true;
});
console.log(`File read with success. Lines: ${lines.length}`);
```

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `options` | [`ReadJsonLineOptions`][] | [`ReadJsonLineOptions`][] |
| `fn` | [`ReadJsonLinesFunction`][] | function executed for each line readed: `(obj: any) => boolean \| Promise<boolean>` if the function return false the execution will be stopped. |

##### Returns

`void`

▸ **fsPromises.readJsonLines**(`path`, `fn`): `void`

##### Parameters

| Name | Type | Description |
| :-- | :-- | :-- |
| `path` | [`PathLike`][] | path to file |
| `fn` | [`ReadJsonLinesFunction`][] | function executed for each line readed: `(obj: any) => boolean \| Promise<boolean>` if the function return false the execution will be stopped. |

##### Returns

`void`

---

#### fsPromises.writeJsonFile

▸ **fsPromises.writeJsonFile**<`T`\>(`path`, `obj`, `options`): `void`

Converts a JavaScript value to a JavaScript Object Notation (JSON) string and write it to a file

```js
import * as fs from "fs-extender";
await fs.promises.writeJsonFile(path, { name: "Jonh Smith", age: 1001 });
console.log(`File writed with success`);
```

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name       | Type                   | Description                            |
| :--------- | :--------------------- | :------------------------------------- |
| `path`     | [`PathLike`][]         | path to file                           |
| `obj`      | `T`                    | object to write to file as json string |
| `options?` | [`WriteJsonOptions`][] | [`WriteJsonOptions`][]                 |

##### Returns

`void`

---

## Type Aliases

### ReplacerType

Ƭ **ReplacerType**: (`key`: `string`, `value`: `any`) => `any` \| (`string` \| `number`)[] \| `null`

[`Mozilla Json Replacer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter)

---

### ReadJsonOptions

Ƭ **ReadJsonOptions**: `Object`

##### Type declaration

| Name        | Type              | Description                                                          |
| :---------- | :---------------- | :------------------------------------------------------------------- |
| `encoding?` | `BufferEncoding`  | [`BufferEncoding`][] used to read the file, default: `utf8`          |
| `reviver?`  | [`ReviverType`][] | Reviver function used to parse the json string, default: `undefined` |
| `throws?`   | `boolean`         | should throw if an error occur, default: `true`                      |
| `flag?`     | `string`          | flag used to open the file, default: `r`                             |

---

### ReadJsonLineOptions

Ƭ **ReadJsonLineOptions**: `Object`

##### Type declaration

| Name        | Type              | Description                                                          |
| :---------- | :---------------- | :------------------------------------------------------------------- |
| `encoding?` | `BufferEncoding`  | [`BufferEncoding`][] used to read the file, default: `utf8`          |
| `reviver?`  | [`ReviverType`][] | Reviver function used to parse the json string, default: `undefined` |
| `throws?`   | `boolean`         | should throw if an error occur, default: `true`                      |

---

### ReadJsonLinesFunction

Ƭ **ReadJsonLinesFunction**: <T\>(`obj?`: `T`) => `boolean` \| `Promise`<`boolean`\>

##### Type declaration

▸ <`T`\>(`obj?`): `boolean` \| `Promise`<`boolean`\>

return `boolean`, if false will stop execution

##### Type parameters

| Name |
| :--- |
| `T`  |

##### Parameters

| Name   | Type |
| :----- | :--- |
| `obj?` | `T`  |

##### Returns

`boolean` \| `Promise`<`boolean`\>

---

### ReviverType

Ƭ **ReviverType**: (`key`: `string`, `value`: `any`) => `any`

##### Type declaration

▸ (`key`, `value`): `any`

##### Parameters

| Name    | Type     |
| :------ | :------- |
| `key`   | `string` |
| `value` | `any`    |

##### Returns

`any`

[`Mozilla Json Reviver`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#using_the_reviver_parameter)

---

### WriteJsonOptions

Ƭ **WriteJsonOptions**: `Object`

##### Type declaration

| Name | Type | Description |
| :-- | :-- | :-- |
| `EOL?` | `string` | End Of Line character default: `\n` |
| `encoding?` | [`BufferEncoding`][] \| `null` | The encoding used to write the file, default: `utf8` |
| `finalEOL?` | `boolean` | Use EOL character at the end of the file, default: `true` |
| `flag?` | `string` | Flag to be used when writing the file, default: `wx`, Open file for writing but fails if path exists |
| `mode?` | `number` \| `string` | The mode used to for the file, default: `0o666` |
| `replacer?` | [`ReplacerType`][] | A function that transforms the results or an array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified. |
| `spaces?` | `number` \| `string` \| `null` | Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read. |

[`pathlike`]: types.md#pathlike
[ensurefile]: ensure.md#ensurefile
[writejsonfile]: #writejsonfile
[`writejsonoptions`]: #writejsonoptions
[writejsonfilesync]: #writejsonfilesync
[ensurefilesync]: ensure.md#ensurefilesync
[`readjsonoptions`]: #readjsonoptions
[`readjsonlineoptions`]: #readjsonlineoptions
[`readjsonlinesfunction`]: #readjsonlinesfunction
[fspromises.writejsonfile]: #fspromiseswritejsonfile
[fspromises.ensurefile]: ensure.md#fspromisesensurefile
[`bufferencoding`]: types.md#bufferencoding
[`replacertype`]: #replacertype
[`revivertype`]: #revivertype
