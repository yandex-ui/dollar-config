# Dollar config

Dollar config lets you keep dynamic settings in a declarative way and query them with runtime params.

[![Build Status](https://travis-ci.org/razetdinov/dollar-config.svg?branch=master)](https://travis-ci.org/razetdinov/dollar-config)

<!--ts-->
   * [Dollar config](#dollar-config)
      * [Installation](#installation)
      * [Setup](#setup)
      * [Usage](#usage)
      * [Examples](#examples)
         * [Static setting](#static-setting)
         * [Default setting](#default-setting)
         * [Reference to a param](#reference-to-a-param)
         * [Template setting](#template-setting)
         * [Guarded setting](#guarded-setting)
         * [Switched setting](#switched-setting)
         * [Nested settings/params](#nested-settingsparams)
         * [Nested $-keywords](#nested--keywords)
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
A common pattern for [express](http://expressjs.com/) applications:
```js
function expressMiddleware(req, res, next) {
    const value = config.get('path.to.setting', req);
    ...
}
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

### Default setting
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

### Reference to a param
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

### Template setting
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

### Guarded setting
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

### Switched setting
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
        [ "midday", "launch" ],
        [ "evening", "dinner" ],
        [ "$default", "fridge" ]
      ]
    ]
  }
}
```
```js
config.get('meal', { dayOfTime: 'midday' });
> launch

config.get('meal', { dayOfTime: 'night' });
> fridge
```

### Nested settings/params
Deep properties are accessible with dot-notation (both in settings and params):
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
