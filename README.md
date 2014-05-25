# es6-modules-commonjs

Compiles JavaScript written using ES6 modules to CommonJS syntax.
For example, this:

```js
module React from "react";
import {format} from "util";
export {React, format as fmt};
```

compiles to this:

```js
var React = require("react");
var format = require("util")["format"];
module.exports["React"] = React, module.exports["fmt"] = format;
```

For more information about the proposed syntax, see the [wiki page on
modules](http://wiki.ecmascript.org/doku.php?id=harmony:modules).

## Install

```
$ npm install es6-modules-commonjs
```

## Usage

```js
$ node
> var compile = require('es6-modules-commonjs').compile;
```

Without arguments:

```js
> compile('module util from "util";');
'var util = require("util");'
```

## Browserify

Browserify support is built in.

```
$ npm install es6-modules-commonjs  # install local dependency
$ browserify -t es6-modules-commonjs $file
```

### Setup

First, install the development dependencies:

```
$ npm install
```

Then, try running the tests:

```
$ npm test
```
