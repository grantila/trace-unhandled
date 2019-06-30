[![npm version][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]
[![build status][travis-image]][travis-url]
[![coverage status][coverage-image]][coverage-url]
[![greenkeeper badge][greenkeeper-image]][greenkeeper-url]
[![Language grade: JavaScript][lgtm-image]][lgtm-url]

# trace-unhandled

Node.js warns on unhandled promise rejections. You might have seen:

```
(node:1234) UnhandledPromiseRejectionWarning
```

When this happens, it's not always obvious what promise is unhandled. The error displayed in the stack trace is the trace to the *error object construction*, not the construction of the promise which left it dangling. It might have travelled through various asynchronous chains before it got to an unhandled promise chain.

`trace-unhandled` changes this. It keeps track of promises and when an *unhandled promise rejection* is logged, the location of both the error object **and** the promise is logged. This makes it a lot easier to find the bug.

**This package is not intended to be used in production, only to aid locating bugs**

# Usage

## As a standalone program

`trace-unhandled` exports a program which can run JavaScript files and shebang scripts. Instead of running your program as `node index.js` you can do `trace-unhandled index.js` as long as `trace-unhandled` is globally installed.

You can also use `npx`:

`npx trace-unhandled index.js`


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

## Use in unit tests

To use this package when running `jest`, install the package and configure jest with the following setup:

```js
{
  setupFiles: [
    "trace-unhandled/register"
  ]
}
```

The tests will now log much better information about unhandled promise rejections.


[npm-image]: https://img.shields.io/npm/v/trace-unhandled.svg
[npm-url]: https://npmjs.org/package/trace-unhandled
[downloads-image]: https://img.shields.io/npm/dm/trace-unhandled.svg
[travis-image]: https://img.shields.io/travis/grantila/trace-unhandled/master.svg
[travis-url]: https://travis-ci.org/grantila/trace-unhandled
[coverage-image]: https://coveralls.io/repos/github/grantila/trace-unhandled/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/grantila/trace-unhandled?branch=master
[greenkeeper-image]: https://badges.greenkeeper.io/grantila/trace-unhandled.svg
[greenkeeper-url]: https://greenkeeper.io/
[lgtm-image]: https://img.shields.io/lgtm/grade/javascript/g/grantila/trace-unhandled.svg?logo=lgtm&logoWidth=18
[lgtm-url]: https://lgtm.com/projects/g/grantila/trace-unhandled/context:javascript
