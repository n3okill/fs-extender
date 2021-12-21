[fs-extender](../README.md) / Environment Variables

# Environment Variables

This environment variables can used to costumize the fs-extender module.

## FS_EXTENDER_FS_OVERRIDE

-   Used to override default fs module used by this module, default `fs`

## FS_EXTENDER_IGNORE_PATCH_CLOSE

-   USed to ignore the patching of fs close functions, default `false`

## FS_EXTENDER_IGNORE_PATCH

-   Used to ignore all the patching done by this module, default `false`

## FS_EXTENDER_TIMEOUT

-   General max timeout for functions that use timeout, default `60000` => `60` seconds

## FS_EXTENDER_TIMEOUT_SYNC

-   General max timeout for sync functions that use timeout, default `60000` => `60` seconds
    -   Be carefull because sync functions will block your event loop for the timeout given

## FS_EXTENDER_WIN32_TIMEOUT

-   Used to set the max timeout for `rename` patched in `win32` system, default `60000` => `60` seconds
    -   If not set will be the same as `FS_EXTENDER_TIMEOUT`

## FS_EXTENDER_WIN32_TIMEOUT_SYNC

-   Same as `FS_EXTENDER_WIN32_TIMEOUT` but for sync `rename` patched in `win32` system, default `60000` => `60` seconds
    -   If not set will be the same as `FS_EXTENDER_TIMEOUT_SYNC`
    -   Be carefull because sync functions will block your event loop for the timeout given
