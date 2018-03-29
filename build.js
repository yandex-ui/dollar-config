'use strict';

const flatten = require('flat');

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
            // TODO: replace with destructuring in node 8
            const $param = value.$param;
            const $template = value.$template;
            const $guard = value.$guard;
            const $switch = value.$switch;

            if ($param) {
                if (typeof $param === 'string') {
                    return $param in params ? params[$param] : value;
                }
                if ($param[0] in params) {
                    const result = params[$param[0]];
                    return result === undefined ? resolve($param[1], params) : result;
                }
                return { $param: [ $param[0], resolve($param[1], params) ] };
            }

            if ($template) {
                let isResolved = true;
                const result = $template.replace(/\$\{([^}]+)\}/g, (match, path) => {
                    if (path in params) {
                        return params[path];
                    }
                    isResolved = false;
                    return match;
                });
                return isResolved ? result : { $template: result };
            }

            if ($guard) {
                const items = [];
                $guard.every((item) => {
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
            }

            if ($switch) {
                if ($switch[0] in params) {
                    const test = params[$switch[0]];
                    const item = $switch[1].find((item) => item[0] === test || item[0] === '$default');
                    return item && resolve(item[1], params);
                }
                return {
                    $switch: [
                        $switch[0],
                        $switch[1].map((item) => [ item[0], resolve(item[1], params) ])
                    ]
                };
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
