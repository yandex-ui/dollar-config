# Dollar config

Dollar config lets you keep dynamic settings in a declarative way and query them with runtime params.

[![Build Status](https://travis-ci.org/razetdinov/dollar-config.svg?branch=master)](https://travis-ci.org/razetdinov/dollar-config)
[![npm version](https://badge.fury.io/js/dollar-config.svg)](https://badge.fury.io/js/dollar-config)
[![Coverage Status](https://coveralls.io/repos/github/razetdinov/dollar-config/badge.svg?branch=master)](https://coveralls.io/github/razetdinov/dollar-config?branch=master)

<!--ts-->
   * [Dollar config](#dollar-config)
      * [Installation](#installation)
      * [Setup](#setup)
      * [Usage](#usage)
      * [Features](#features)
         * [Static setting](#static-setting)
         * [$default](#default)
         * [$param](#param)
         * [$template](#template)
         * [$guard](#guard)
         * [$switch](#switch)
         * [$function](#function)
         * [Nested settings/params/functions](#nested-settingsparamsfunctions)
         * [Nested $-keywords](#nested--keywords)
      * [Binding](#binding)
      * [Express middleware](#express-middleware)
      * [Validation](#validation)
      * [Building](#building)

<!-- Added by: azat, at: 2018-03-11T01:08+0300 -->

<!--te-->

## Installation
```sh
npm install dollar-config
```

## Setup
```js
const DollarConfig = require('dollar-config');

const config = new DollarConfig(require('config.json'));
```

## Usage
```js
config.get('path.to.setting', runtimeParams);
```

## Examples

### Static setting
No magic here.
```js
{
  "foo": 1
}
```
```js
config.get('foo');
> 1
```

### $default
Provides a fallback for an absent setting.
```js
{
  "foo": 1,
  "$default": 0
}
```
```js
config.get('bar');
> 0
```

### $param
Looks up a param and returns its value.
```js
{
  "foo": {
    "$param": "bar"
  }
}
```
```js
config.get('foo', { bar: 1 });
> 1
```

Use an array to provide a default value:
```js
{
  "foo": {
    "$param": [ "bar", 0 ]
  }
}
```
```js
config.get('foo', { baz: 1 });
> 0
```

### $template
Replaces `${paramName}` with param value.
```js
{
  "greeting": {
    "$template": "Hello, ${name}!"
  }
}
```
```js
config.get('greeting', { name: 'John' });
> Hello, John!
```

### $guard
Picks the first truthy param and returns correspondent setting.

Falls back to an optional `$default` if none of the params is truthy.

N.B. `$default`, if present, must be the last item for lookup performance.
```js
{
  "foo": {
    "$guard": [
      [ "bar", "no luck" ],
      [ "baz", "close, but no cigar" ],
      [ "qux", "you are the champion" ],
      [ "$default", "oops" ]
    ]
  }
}
```
```js
config.get('foo', { bar: false, baz: '', qux: 1 });
> you are the champion

config.get('foo', {})
> oops
```

### $switch
Matches param value to a list of cases and picks correspondent setting.

Falls back to an optional `$default` if no match is found.

N.B. `$default`, if present, must be the last item for lookup performance.
```js
{
  "meal": {
    "$switch": [
      "dayOfTime",
      [
        [ "morning", "breakfast" ],
        [ "midday", "lunch" ],
        [ "evening", "dinner" ],
        [ "$default", "fridge" ]
      ]
    ]
  }
}
```
```js
config.get('meal', { dayOfTime: 'midday' });
> lunch

config.get('meal', { dayOfTime: 'night' });
> fridge
```

### $function
Calls the referenced function and returns it's value.

Functions are provided as an option to config constructor.

Each function recevies `params` as a single argument.
```js
{
  "expectedSalary": {
    "$function": "double"
  }
}
```
```js
const config = new DollarConfig(require('config.json'), {
    functions: {
        double: (params) => params.currentSalary * 2
    }
});

config.get('expectedSalary', { currentSalary: 500 });
> 1000
```

### Nested settings/params/functions
Deep properties are accessible with dot-notation:
```js
{
  "foo": {
    "bar": {
      "$param": "baz.qux"
    }
  }
}
```
```js
config.get('foo.bar', { baz: { qux: 1 } });
> 1
```

### Nested $-keywords
You can mix and match $-keywords to get the desired effect:
```js
{
  "foo": {
    "$switch": [
      "bar",
      [
        [
          "baz",
          {
            "$guard": [
              [ "qux", { "$param": "xyz" } ]
            ]
          }
        ]
      ]
    ]
  }
}
```
```js
config.get('foo', { bar: 'baz', qux: true, xyz: 1 });
> 1
```

## Binding
The `.bind()` method clones your config, converting all dynamic keys to getters, so that you can use them as a normal object:
```js
const config = new DollarConfig({
    foo: 1,
    bar: { $param: 'baz' }
});

config.bind({ baz: 2 });
> { foo: 1, bar: 2 }
```

Because all dynamic keys are evaluated lazily, you can even make self-references:
```js
const config = new DollarConfig({
    foo: { $param: 'baz' },
    bar: { $param: 'config.foo' }
});

const params = { baz: 1 };
params.config = config.bind(params);

params.config
> { foo: 1, bar: 1 }
```

After the first invocation getters replace themselves with evaluated values (a.k.a memoization):
```js
let i = 1;
const config = new DollarConfig(
    { foo: { $function: 'bar' } },
    { functions: { bar: () => i++ } }
);
const boundConfig = config.bind({});

boundConfig.foo
> 1

boundConfig.foo
> 1
```


## Express middleware
Dollar config [express](http://expressjs.com/) middleware [binds](#binding) provided config to the express `req` and puts the result into `req.config`:
```js
{
  "foo": {
    "$param": "query.bar"
  }
}
```
```js
const dollarConfigMiddleware = require('dollar-config/middleware');

app.use(dollarConfigMiddleware(require('config.json'));

// /?bar=1
app.use((req, res, next) => {
    req.config.foo === 1 // true
});
```

The middleware accepts dollar config instances as well:
```js
const dollarConfigMiddleware = require('dollar-config/middleware');

const config = new DollarConfig(require('config.json'));

app.use(dollarConfigMiddleware(config));
```

## Validation
You can use special [ajv](https://github.com/epoberezkin/ajv) plugin to validate dollar-configs against JSON schemas.
```js
const ajv = require('dollar-config/ajv')(new Ajv());
const validate = ajv.compile(require('schema.json'));
```

Or, with [ajv-cli](https://github.com/jessedc/ajv-cli):
```sh
ajv validate -d config.json -s schema.json -c dollar-config/ajv
```

The plugin introduces a custom `dynamic` keyword which accepts any valid JSON schema inside it:
```js
{
  "type": "object",
  "properties": {
    "foo": {
      "dynamic": {
        "type": "number"
      }
    }
  }
}
```
```js
validate({ foo: 1 });
> true

validate({ foo: { $param: 'bar' } });
> true
```

The plugin checks that leaf values of $-keywords match original schema:
```js
validate({ foo: { $param: [ 'bar', 1 ] } });
> true

validate({ foo: { $param: [ 'bar', '1' ] } });
> false (expected number, got string)

validate({ foo: { $guard: [ [ 'bar': '1' ] ] } });
> false (expected number, got string)
```

Using `$template` implies that the original schema is string:
```js
validate({ foo: { $template: '${bar}/${baz}' } });
> false (expected original schema to be string, got number)
```

## Building
Sometimes you want to have separate configs for different environments. Dollar config lets you keep all the settings in one source config and generate per-environment configs. `dollar-config/build` can be used to inline predefined params. Other dynamic params are returned as-is.

```js
{
  "backendUrl": {
    "$switch": [
      "environment",
      [
        [ "prestable", "https://prestable-backend/" ],
        [ "$default", "https://production-backend/" ]
      ]
    ]
  },
  "backendQuery": {
    "foo": { "$param": "bar" }
  }
}
```
```js
const buildConfig = require('dollar-config/build');

const config = require('config.json');

buildConfig(config, { environment: 'prestable' });
>
{
  backendUrl: "https://prestable-backend/",
  backendQuery: {
    "foo": { "$param": "bar" }
  }
}

buildConfig(config, { environment: 'production' });
>
{
  backendUrl: "https://production-backend/",
  backendQuery: {
    "foo": { "$param": "bar" }
  }
}
```
