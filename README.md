# FS-EXTENDER

Extender module for node filesystem

---

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/505e148f7fb74861a83f687fd0bf88b7)](https://www.codacy.com/gh/n3okill/fs-extender/dashboard?utm_source=github.com&utm_medium=referral&utm_content=n3okill/fs-extender&utm_campaign=Badge_Grade) ![Test Status](https://github.com/n3okill/fs-extender/actions/workflows/test.yml/badge.svg)

---

## Description

The intention of this module is to provide many functions that don't yet exist in node `fs` module, like `copy`, `move`, `list`, `find`..., and also normalize their functioning between node versions.

This module don't make any changes to node `fs` module, except patching `close` and `closeSync`, and it can be turned off.

At its core this module works like `graceful-fs` but instead of cloning the `fs` module it makes an augmentation of the `fs` module or any other `fs` model type like. [Environment Variables](docs/environmentvariables.md)

This module can be used like a `fs` replacement module.

## Usage

Install the package

```js
npm install --save fs-extender
```

```js
import * as fs from "fs-extender";

fs.copy(dir, someOtherDir, (err) => {
    if (!err) {
        console.log("Directory copied with sucess.");
    }
});
```

or

```js
const fs = require("fs-extender");

fs.copy(dir, someOtherDir, (err) => {
    if (!err) {
        console.log("Directory copied with sucess.");
    }
});
```

## Runing tests

-   `npm run lint`: runs the linter
-   `npm run unit`: run unit tests
-   `npm test`: run both lint and unit tests
-   `npm testUlimit`: run tests defining ulimit to `50`
-   `npm testMemoryLeak`: run tests to check for memoery leakage
-   `npm testExternalFs`: run tests based on provided `fs` module
-   `npm testExternalMockedFs`: run tests based on provided `fs` module that act like a mock
-   `npm test-all`: run all the above tests

## Contribute

If you find a problem with the package you can

-   [Submit a Bug](https://github.com/n3okill/fs-extender/issues)
    -   If you provide a test case it will make the issue resolution faster

or even make a

-   [Pull request](https://github.com/n3okill/fs-extender/pulls)

### Add something new

If you wan't to add something new, following this steps would be much apreciated:

-   Develop the new helper, with clean and readable code
-   Develop tests for the new helper
-   Include in the comments a description of what the helper does, the input arguments and what it returns

## Documentation

Besides the node file system [documentation](https://nodejs.org/api/fs.html) for all the node `fs` related functions the new methods provided can be found below.

-   [Environment Variables](docs/environmentvariables.md) - Environment variables documentation

    -   [FS_EXTENDER_FS_OVERRIDE](docs/environmentvariables.md#FS_EXTENDER_FS_OVERRIDE)
    -   [FS_EXTENDER_IGNORE_PATCH_CLOSE](docs/environmentvariables.md#FS_EXTENDER_IGNORE_PATCH_CLOSE)
    -   [FS_EXTENDER_IGNORE_PATCH](docs/environmentvariables.md#FS_EXTENDER_IGNORE_PATCH)
    -   [FS_EXTENDER_TIMEOUT](docs/environmentvariables.md#FS_EXTENDER_TIMEOUT)
    -   [FS_EXTENDER_TIMEOUT_SYNC](docs/environmentvariables.md#FS_EXTENDER_TIMEOUT_SYNC)
    -   [FS_EXTENDER_WIN32_TIMEOUT](docs/environmentvariables.md#FS_EXTENDER_WIN32_TIMEOUT)
    -   [FS_EXTENDER_WIN32_TIMEOUT_SYNC](docs/environmentvariables.md#FS_EXTENDER_WIN32_TIMEOUT_SYNC)

-   [Patched](docs/patched.md)
-   [New Methods](docs/newmethods.md#table-of-contents)

    -   [isEmpty](docs/newmethods.md#isempty) => Check if given item is empty
    -   [isEmptySync](docs/newmethods.md#isemptysync) => Check if given item is empty
    -   [statsIsDirectory](docs/newmethods.md#statisdirectory) => check if item is a directory
    -   [statIsDirectorySync](docs/newmethods.md#statisdirectorysync) => check if item is a directory
    -   [statIsFile](docs/newmethods.md#statisfile) => check if item is a file
    -   [statIsFileSync](docs/newmethods.md#statisfilesync) => check if item is a file
    -   [statIsSymbolicLink](docs/newmethods.md#statissymboliclink) => check if item is a SymLink
    -   [statIsSymbolicLinkSync](docs/newmethods.md#statissymboliclinksync) => check if item is a SymLink
    -   Promises API
        -   [fsPromises.isEmpty](docs/newmethods.md#fspromisesisempty) => Check if given item is empty
        -   [fsPromises.statIsDirectory](docs/newmethods.md#fspromisesstatisdirectory) => check if item is a directory
        -   [fsPromises.statIsFile](docs/newmethods.md#fspromisesstatisfile) => check if item is a file
        -   [fsPromises.statIsSymbolicLink](docs/newmethods.md#fspromisesstatissymboliclink) => check if item is a SymLink

-   [Compare](docs/compare.md#table-of-contents) => Compare files or directories

    -   [dirByte](docs/compare.md#dirbyte) => Compare two directories in a byte-to-byte file comparison
    -   [dirHash](docs/compare.md#dirhash) => Compare two directories with a hash file comparison
    -   [dirByteSync](docs/compare.md#dirbytesync) => Compare two directories in a byte-to-byte file comparison
    -   [dirHashSync](docs/compare.md#dirhashsync) => Compare two directories with a hash file comparison
    -   [filesByte](docs/compare.md#filesbyte) => Compare two files in a byte-to-byte comparison
    -   [filesHash](docs/compare.md#fileshash) => Compare two files in a hash comparison
    -   [filesByteSync](docs/compare.md#filesbytesync) => Compare two files in a byte-to-byte comparison
    -   [filesHashSync](docs/compare.md#fileshashsync) => Compare two files in a hash comparison
    -   Promises API
        -   [fsPromises.dirByte](docs/compare.md#fspromisesdirbyte) => Compare two directories in a byte-to-byte file comparison
        -   [fsPromises.dirHash](docs/compare.md#fspromisesdirhash) => Compare two directories with a hash file comparison
        -   [fsPromises.filesByte](docs/compare.md#fspromisesfilesbyte) => Compare two files in a byte-to-byte comparison
        -   [fsPromises.filesHash](docs/compare.md#fspromisesfileshash) => Compare two files in a hash comparison

-   [Copy](docs/copy.md) => Copy Files

    -   [copy](docs/copy.md#copy) => async copy
    -   [copySync](docs/copy.md#copySync) => sync copy
    -   Promises API
        -   [copy](docs/copy.md#fspromisescopy) => promise copy

-   [Ensure](docs/ensure.md) => Ensure the existence of various items in file system

    -   [ensureDir](docs/ensure.md#ensuredir) => Ensures directory exostence in file system
    -   [ensureFile](docs/ensure.md#ensurefile) => Ensures file existence in file system
    -   [ensureLink](docs/ensure.md#ensurelink) => Ensures link existence in file system
    -   [ensureSymlink](docs/ensure.md#ensuresymlink) => Ensures symlink existence in file system
    -   [ensureDirSync](docs/ensure.md#ensuredirsync) => Ensures directory exostence in file system
    -   [ensureFileSync](docs/ensure.md#ensurefilesync) => Ensures file existence in file system
    -   [ensureLinkSync](docs/ensure.md#ensurelinksync) => Ensures link existence in file system
    -   [ensureSymlinkSync](docs/ensure.md#ensuresymlinksync) => Ensures symlink existence in file system
    -   Promises API
        -   [ensureDir](docs/ensure.md#fspromisesensuredir) => Ensures directory exostence in file system
        -   [ensureFile](docs/ensure.md#fspromisesensurefile) => Ensures file existence in file system
        -   [ensureLink](docs/ensure.md#fspromisesensurelink) => Ensures link existence in file system
        -   [ensureSymlink](docs/ensure.md#fspromisesensuresymlink) => Ensures symlink existence in file system

-   [Find](docs/find.md) => Find items in the file system

    -   [find](docs/find.md#find) => async find
    -   [findSync](docs/find.md#findsync) => sync find
    -   Promise API
        -   [promises.find](docs/find.md#fspromisesfind) => promise find

-   [Json](docs/json.md) => Multiple json related tools to work with files

    -   [ensureJsonFile](docs/json.md#ensurejsonfile) => write object to json file ensuring file existence
    -   [readJsonFile](docs/json.md#readjsonfile) => read object from json file
    -   [readJsonLines](docs/json.md#readjsonlines) => read json file line by line
    -   [writeJsonFile](docs/json.md#writejsonfile) => write object to json file
    -   [ensureJsonFileSync](docs/json.md#ensurejsonfilesync) => write object to json file ensuring file existence
    -   [readJsonFileSync](docs/json.md#readjsonfilesync) => read object from json file
    -   [writeJsonFileSync](docs/json.md#writejsonfilesync) => write object to json file
    -   Promise API
        -   [promises.ensureJsonFile](docs/json.md#fspromisesensurejsonfile) => write object to json file ensuring file existence
        -   [promises.readJsonFile](docs/json.md#fspromisesreadjsonfile) => read object from json file
        -   [promises.readJsonLines](docs/json.md#fspromisesreadjsonlines) => read json file line by line
        -   [promises.writeJsonFile](docs/json.md#fspromiseswritejsonfile) => write object to json file

-   [List](docs/list.md) => List items in file system

    -   [list](docs/list.md#list) => async list
    -   [listSync](docs/list.md#listsync) => sync list
    -   Promise API
        -   [promises.list](docs/list.md#fspromiseslist) => promise list

-   [Mkdirp](docs/mkdirp.md) => Recursive creation of directories

    -   [mkdirp](docs/mkdirp.md#mkdirp) => async mkdirp
    -   [mkdirpSync](docs/mkdirp.md#mkdirpsync) => sync mkdirp
    -   Promise API
        -   [promises.mkdirp](docs/mkdirp.md#fspromisesmkdirp) => promise mkdirp

-   [Move](docs/move.md) => Move items in the file system

    -   [move](docs/move.md#move) => async move
    -   [moveSync](docs/move.md#movesync) => sync move
    -   Promise API
        -   [promises.move](docs/move.md#fspromisesmove) => promise move

-   [Rm](docs/rm.md) => Remove items from the file system

    -   [rm](docs/rm.md#rm) => async rm
    -   [rmSync](docs/rm.md#rmsync) => sync rm
    -   Promise API
        -   [promises.rm](docs/rm.md#fspromisesrm) => promise rm

-   [EmptyDir](docs/emptydir.md#EmptyDir) => Clean items from directory
    -   [emptyDir](docs/emptydir.md#emptydir) => async emptyDir
    -   [emptyDirSync](docs/emptydir.md#emptydirsync) => sync emptyDir
    -   Promise API
        -   [promises.emptyDir](docs/emptydir.md#fspromisesemptydir) => promise emptyDir
-   [Size](docs/Size.md) => Check the size of an item in the file system

    -   [size](docs/size.md#size) => async size
    -   [sizeSync](docs/size.md#sizesync) => sync size
    -   Promise API
        -   [promises.size](docs/size.md#fspromisessize) => promise size

-   [Walk](docs/Walk.md) => Walk through directories
    -   [walk](docs/walk.md#walk) => async walk
    -   [walkSync](docs/walk.md#walksync) => sync walk
    -   Promise API
        -   [promises.walk](docs/walk.md#fspromiseswalk) => promise walk

## Examples

For more examples just check the tests folder

## Why this module

First things first,

Why not use something like the `graceful-fs` module?

When this module was started `graceful-fs` changed the `fs` module directly, that was a no go, if some of the node base modules must change it's way of functioning it must be done very carefully and in very rare occasions, just like the patch that this module implements in `close` file functions, just like `graceful-fs` now does, and because there's no way to don't use the `graceful-fs` when it is loaded in another module in the chain (see why not using jest for tests).

Why not use something like the `fs-extra` module?

Fisrt, because when this module was started the fs-extra didn't exist or was in their infancy, there where some tools like `ncp` (abandoned copy module) and other's but it was a pain to use all that separated tools.

Second because `fs-extra` is a fantastic module but in the background it operates (or used to) on top of `graceful-fs` (see first awnser) and it doens't have all the tools and options that I needed.

Why not use `Jest` for tests?

Because `jest` uses `fs-extra` as one of the dependencies and as we saw `fs-extra` uses `graceful-fs` and that makes impossible to test this module with `jest` and there's no way to remove `graceful-fs` from the chain, with this module you can bypass it if you wan't (see [Environment Variables](docs/environmentvariables.md)), even if it come from another module.

The modules that originated this module where using `jest` for tests until `jest` started using `fs-extra` and then the number of perfectly valid tests failling was impressive, then `mocha` to the rescue.

## Credits

-   [ncp](https://github.com/AvianFlu/ncp) - One of the modules that originated all this module (forget about the name of some others)
-   [graceful-fs](https://github.com/isaacs/node-graceful-fs) - A very good module for patching the fs module but with some flaws mainly the lack of an option to bypass the module
-   [fs-extra](https://github.com/jprichardson/node-fs-extra) - A very good module but that don't have all the tools needed for the job (or options for the tools)
-   [`mocha`](https://mochajs.org/) - Very good testing framework.

## License

MIT License

Copyright (c) 2011 - 2021 Joao Parreira [joaofrparreira@gmail.com](mailto:joaofrparreira@gmail.com)
