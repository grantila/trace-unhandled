[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][coverage-image]][coverage-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]

# trace-unhandled

Node.js and browsers warn on unhandled promise rejections. You might have seen:

```
(node:1234) UnhandledPromiseRejectionWarning
```

When this happens, it's not always obvious what promise is unhandled. The error stacktrace will tell where the *error object construction* is, not the construction of the promise which left it dangling. It might have travelled through various asynchronous chains before it got to an unhandled promise chain.

`trace-unhandled` helps with this. It keeps track of promises and when an *unhandled promise rejection* is logged, the location of both the error object **and** the promise is logged. This makes it a lot easier to find the bug.

**This package is not intended to be used in production, only to aid locating bugs**

# Why

Consider the following code which creates an error (on line 1) and rejects a promise (on line 3) and "forgets" to catch it on line 9 (the last line). This is an **incredibly** simple example, and in real life, this would span over a lot of files and a lot of complexity.

```ts {.line-numbers}
1. const err = new Error( "foo" );
2. function b( ) {
3.	return Promise.reject( err );
4. }
5. function a( ) {
6.	return b( );
7. }
8. const foo = a( );
9. foo.then( ( ) => { } );
```

Without `trace-unhandled`, you would get something like:

```
(node:1234) UnhandledPromiseRejectionWarning: Error: foo
    at Object.<anonymous> (/my/directory/test.js:1:13)
    at Module._compile (internal/modules/cjs/loader.js:776:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)
    at Module.load (internal/modules/cjs/loader.js:643:32)
    at Function.Module._load (internal/modules/cjs/loader.js:556:12)
    at Function.Module.runMain (internal/modules/cjs/loader.js:839:10)
    at internal/main/run_main_module.js:17:11
```

This is the output of Node.js. You'll see the stacktrace up to the point of the **Error** `err`, but that's rather irrelevant. What you want to know is where the promise was used leaving a rejection unhandled (i.e. a missing `catch()`). With `trace-unhandled` this is exactly what you get, including the Error construction location:

```
(node:1234) UnhandledPromiseRejectionWarning
[ Stacktrace altered by https://github.com/grantila/trace-unhandled ]
Error: foo
    ==== Promise at: ==================
    at Promise.then (<anonymous>)
    at Object.<anonymous> (/my/directory/test.js:9:5)  👈

    ==== Error at: ====================
    at Object.<anonymous> (/my/directory/test.js:1:13)

    ==== Shared trace: ================
    at Module._compile (internal/modules/cjs/loader.js:776:30)
	... more lines below ...
```

We *"used"* the promise by appending another `.then()` to it. This means that the promise was actually *"handled"*, and that the new promise should handle rejections. If we delete the last line (line 9), we see where the promise was last *"used"*:

```
(node:1234) UnhandledPromiseRejectionWarning
[ Stacktrace altered by https://github.com/grantila/trace-unhandled ]
Error: foo
    ==== Promise at: ==================
    at b (/my/directory/test.js:3:17)                   👈
    at a (/my/directory/test.js:6:9)                    👈
    at Object.<anonymous> (/my/directory/test.js:8:13)  👈

    ==== Error at: ====================
    at Object.<anonymous> (/my/directory/test.js:1:13)

    ==== Shared trace: ================
    at Module._compile (internal/modules/cjs/loader.js:776:30)
	... more lines below ...
```

Both these examples show **clearly** where the *promise* is left unhandled, and not only where the Error object is constructed.


# Usage

`trace-unhandled` can be used in 4 ways.

 * [As a standalone program to bootstrap a Node.js app](#as-a-standalone-program)
 * [From a CDN directly to a browser](#in-a-website)
 * [Programmatically from JavaScript (either for Node.js or the web using a bundler)](#programatically---api)
 * [In unit tests](#in-unit-tests)

## As a standalone program

`trace-unhandled` exports a program which can run JavaScript files and shebang scripts. Instead of running your program as `node index.js` you can do `trace-unhandled index.js` as long as `trace-unhandled` is globally installed.

You can also use `npx`:

`npx trace-unhandled index.js`


## In a website

```html
<head><script src="https://cdn.jsdelivr.net/npm/trace-unhandled@latest/browser.js"></script></head>
```


## Programatically - API

```ts
require( 'trace-unhandled/register' ); // As early as possible
```

or if you want to allow some code to execute before you start tracing:

```ts
const { register } = require( 'trace-unhandled' );

// ... whenever you want to start tracing
register( );
```


## In unit tests

To use this package when running `jest`, install the package and configure jest with the following setup:

```js
{
  setupFiles: [
    "trace-unhandled/register"
  ]
}
```

For `mocha` you can use `--require node_modules/trace-unhandled/register.js`.


[npm-image]: https://img.shields.io/npm/v/trace-unhandled.svg
[npm-url]: https://npmjs.org/package/trace-unhandled
[downloads-image]: https://img.shields.io/npm/dm/trace-unhandled.svg
[travis-image]: https://img.shields.io/travis/grantila/trace-unhandled/master.svg
[travis-url]: https://travis-ci.org/grantila/trace-unhandled
[coverage-image]: https://coveralls.io/repos/github/grantila/trace-unhandled/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/trace-unhandled?branch=master
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/trace-unhandled.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/trace-unhandled/context:javascript
