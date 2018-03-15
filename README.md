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

<!-- Added by: azat, at: 2018-03-11T01:08+0300 -->

<!--te-->

## Installation
```
npm install dollar-config
```

## Setup
```
const DollarConfig = require('dollar-config');

const config = new DollarConfig(require('config.json'));
```

## Usage
```
config.get('path.to.setting', runtimeParams);
```
A common pattern for [express](http://expressjs.com/) applications:
```
function expressMiddleware(req, res, next) {
    const value = config.get('path.to.setting', req);
    ...
}
```

## Examples

### Static setting
No magic here.
```
{
  "foo": 1
}
```
```
config.get('foo');
> 1
```

### Default setting
Provides a fallback for an absent setting.
```
{
  "foo": 1,
  "$default": 0
}
```
```
config.get('bar');
> 0
```

### Reference to a param
Looks up a param and returns its value.
```
{
  "foo": {
    "$param": "bar"
  }
}
```
```
config.get('foo', { bar: 1 });
> 1
```

Use an array to provide a default value:
```
{
  "foo": {
    "$param": [ "bar", 0 ]
  }
}
```
```
config.get('foo', { baz: 1 });
> 0
```

### Template setting
Replaces `${paramName}` with param value.
```
{
  "greeting": {
    "$template": "Hello, ${name}!"
  }
}
```
```
config.get('greeting', { name: 'John' });
> Hello, John!
```

### Guarded setting
Picks the first truthy param and returns correspondent setting.

Falls back to an optional `$default` if none of the params is truthy.
```
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
```
config.get('foo', { bar: false, baz: '', qux: 1 });
> you are the champion

config.get('foo', {})
> oops
```

### Switched setting
Matches param value to a list of cases and picks correspondent setting.

Falls back to an optional `$default` if no match is found.
```
{
  "meal": {
    "$switch": [
      "dayOfTime",
      [
        [ "morning": "breakfast" ],
        [ "midday": "launch" ],
        [ "evening": "dinner" ],
        [ "$default": "fridge" ]
      ]
    }
  }
}
```
```
config.get('meal', { dayOfTime: 'midday' });
> launch

config.get('meal', { dayOfTime: 'night' });
> fridge
```

### Nested settings/params
Deep properties are accessible with dot-notation (both in settings and params):
```
{
  "foo": {
    "bar": {
      "$param": "baz.qux"
    }
  }
}
```
```
config.get('foo.bar', { baz: { qux: 1 } });
> 1
```

### Nested $-keywords
You can mix and match $-keywords to get the desired effect:
```
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
    }
  }
}
```
```
config.get('foo', { bar: 'baz', qux: true, xyz: 1 });
> 1
```

## Validation
You can use special [ajv](https://github.com/epoberezkin/ajv) plugin to validate dollar-configs against JSON schemas.
```
const ajv = require('dollar-config/ajv')(new Ajv());
const validate = ajv.compile(require('schema.json'));
```
Or, with [ajv-cli](https://github.com/jessedc/ajv-cli):
```
ajv validate -d config.json -s schema.json -c dollar-config/ajv
```

The plugin introduces a custom `dynamic` keyword which accepts any valid JSON schema inside it:
```
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
```
validate({ foo: 1 });
> true

validate({ foo: { $param: 'bar' } });
> true
```

The plugin checks that leaf values of $-keywords match original schema:
```
validate({ foo: { $param: [ 'bar', 1 ] } });
> true

validate({ foo: { $param: [ 'bar', '1' ] } });
> false (expected number, got string)

validate({ foo: { $guard: [ [ 'bar': '1' ] ] } });
> false (expected number, got string)
```

Using `$template` implies that the original schema is string:
```
validate({ foo: { $template: ${bar}/${baz}' } });
> false (expected original schema to be string, got number)
```
