[fs-extender](../README.md) / Patched

# Patched Methods

### exists

▸ **exists**(`path`, `callback`): `void`

-   exists function patched to use normalized callback type

Test whether or not the given path exists by checking with the file system. Then call the `callback` argument with either true or false:

```js
import { exists } from "fs-extender";

exists("/etc/passwd", (err, e) => {
    console.log(e ? "it exists" : "no passwd!");
});
```

This method normalizes the functioning of the exists function of Node.js, returning an error as the first argument of callback

Using `fs.exists()` to check for the existence of a file before calling`fs.open()`, `fs.readFile()` or `fs.writeFile()` is not recommended. Doing so introduces a race condition, since other processes may change the file's state between the two calls. Instead, user code should open/read/write the file directly and handle the error raised if the file does not exist.

**write (NOT RECOMMENDED)**

```js
import { exists, open, close } from "fs-extender";

exists("myfile", (err, e) => {
    if (e) {
        console.error("myfile already exists");
    } else {
        open("myfile", "wx", (err, fd) => {
            if (err) throw err;

            try {
                writeMyData(fd);
            } finally {
                close(fd, (err) => {
                    if (err) throw err;
                });
            }
        });
    }
});
```

**write (RECOMMENDED)**

```js
import { open, close, lstatSync } from "fs-extender";
open("myfile", "wx", (err, fd) => {
    if (err) {
        if (err.code === "EEXIST") {
            console.error("myfile already exists");
            return;
        }

        throw err;
    }

    try {
        writeMyData(fd);
    } finally {
        close(fd, (err) => {
            if (err) throw err;
        });
    }
});
```

**read (NOT RECOMMENDED)**

```js
import { open, close, exists } from "fs-extender";

exists("myfile", (err, e) => {
    if (e) {
        open("myfile", "r", (err, fd) => {
            if (err) throw err;

            try {
                readMyData(fd);
            } finally {
                close(fd, (err) => {
                    if (err) throw err;
                });
            }
        });
    } else {
        console.error("myfile does not exist");
    }
});
```

**read (RECOMMENDED)**

```js
import { open, close } from "fs-extender";

open("myfile", "r", (err, fd) => {
    if (err) {
        if (err.code === "ENOENT") {
            console.error("myfile does not exist");
            return;
        }

        throw err;
    }

    try {
        readMyData(fd);
    } finally {
        close(fd, (err) => {
            if (err) throw err;
        });
    }
});
```

The "not recommended" examples above check for existence and then use the file; the "recommended" examples are better because they use the file directly and handle the error, if any.

In general, check for the existence of a file only if the file won’t be used directly, for example when its existence is a signal from another process.

#### Parameters

| Name       | Type                                                               |
| :--------- | :----------------------------------------------------------------- |
| `path`     | [`PathLike`](types.md#pathlike)                                    |
| `callback` | (`err`: `null` \| `ErrnoException`, `exists`: `boolean`) => `void` |

#### Returns

`void`

---

## Other

The patched functions below work just like the node `fs` functions.

▸ **appendFile**

▸ **chown**

▸ **fchown**

▸ **lchown**

▸ **chmod**

▸ **fchmod**

▸ **lchmod**

▸ **lchownSync**

▸ **fchownSync**

▸ **lchownSync**

▸ **chmodSync**

▸ **fchmodSync**

▸ **lchmodSync**

▸ **copyFile**

▸ **lutimes**

▸ **lutimesSync**

▸ **open**

▸ **read**

▸ **readSync**

▸ **readdir**

▸ **readdirSync**

▸ **readFile**

▸ **rename**

▸ **renameSync**

▸ **rmdir**

▸ **rmdirSync**

▸ **stat**

▸ **fstat**

▸ **lstat**

▸ **statSync**

▸ **fstatSync**

▸ **lstatSync**

▸ **unlink**

▸ **unlinkSync**

▸ **writeFile**

▸ **createReadStream**

▸ **createWriteStream**
