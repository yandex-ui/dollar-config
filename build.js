'use strict';

const flatten = require('./lib/flatten.js');

const plugins = {
    $param(value, params) {
        if (typeof value === 'string') {
            return value in params ? params[value] : { $param: value };
        }
        if (value[0] in params) {
            const result = params[value[0]];
            return result === undefined ? resolve(value[1], params) : result;
        }
        return { $param: [ value[0], resolve(value[1], params) ] };
    },

    $template(value, params) {
        let isResolved = true;
        if (!(typeof value === 'string')) {
            value = value.join('');
        }
        const result = value.replace(/\$\{([^}]+)\}/g, (match, path) => {
            if (path in params) {
                return params[path];
            }
            isResolved = false;
            return match;
        });
        return isResolved ? result : { $template: result };
    },

    $guard(value, params) {
        const items = [];
        value.every((item) => {
            if (item[0] in params) {
                if (params[item[0]]) {
                    items.push([ '$default', resolve(item[1], params) ]);
                    return false;
                }
            } else {
                items.push([ item[0], resolve(item[1], params) ]);
            }
            return true;
        });
        if (items.length === 0) {
            return undefined;
        }
        if (items.length === 1 && items[0][0] === '$default') {
            return items[0][1];
        }
        return { $guard: items };
    },

    $switch(value, params) {
        if (value[0] in params) {
            const test = params[value[0]];
            const item = value[1].find((item) => {
                const _case = item[0];
                if (_case === test) {
                    return true;
                }
                if (Array.isArray(_case) && _case.indexOf(test) !== -1) {
                    return true;
                }
                return _case === '$default';
            });
            return item && resolve(item[1], params);
        }
        return {
            $switch: [
                value[0],
                value[1].map((item) => [ item[0], resolve(item[1], params) ])
            ]
        };
    },

    $function(value, params) {
        return { $function: [ value, params ] };
    }
};

const keywords = Object.keys(plugins);

/**
 * Builds config with predefined params.
 *
 * @param {object} config - Config.
 * @param {object} params - Predefined params.
 * @returns {*} Built config.
 */
function build(config, params) {
    return resolve(config, flatten(params));
}

/**
 * Resolves config value with predefined settings.
 *
 * @param {*} value - Config value.
 * @param {object} params - Flattened predefined params.
 * @returns {*} Resolved value.
 */
function resolve(value, params) {
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            return value.map((value) => resolve(value, params));
        } else {
            const keyword = keywords.find((keyword) => value[keyword]);

            if (keyword) {
                return plugins[keyword](value[keyword], params);
            }

            return Object.keys(value).reduce((result, key) => {
                result[key] = resolve(value[key], params);
                return result;
            }, {});
        }
    }

    return value;
}

module.exports = build;
