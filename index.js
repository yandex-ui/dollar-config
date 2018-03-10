'use strict';

class Config {
    /**
     * @param {Object} data - Config data.
     */
    constructor(data) {
        this._data = data;
    }

    /**
     * Computes config value.
     *
     * @param {Array|string} path - The path of the property to get.
     * @param {Object} [params] - Dynamic params.
     * @returns {*} - Config value.
     */
    get(path, params) {
        if (typeof path === 'string') {
            path = path.split('.');
        }

        const length = path.length;
        let value = this._data;
        let index = 0;

        while (value != null) {
            const isLast = index === length;
            if (params) {
                value = this._resolve(value, params, isLast);
            }
            if (isLast) {
                break;
            }
            value = getProperty(value, path[index++]);
        }

        return value;
    }

    /**
     * Resolves config value.
     *
     * @param {*} value - Dot-delimited path to config value.
     * @param {Object} params - Dynamic params.
     * @param {boolean} [deep=false] - Recursively resolve nested properties.
     * @returns {*} - Config value.
     */
    _resolve(value, params, deep) {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                if (deep) {
                    return value.map((value) => this._resolve(value, params, true));
                }
            } else {
                if (value.$ref) {
                    const result = get(params, value.$ref);
                    return result === undefined ? this._resolve(value.$default, params) : result;
                }
                if (value.$template) {
                    return value.$template.replace(/\$\{([^}]+)\}/g, (_, path) => get(params, path));
                }
                if (value.$guard) {
                    const path = Object.keys(value.$guard).find((path) => get(params, path));
                    return this._resolve(value.$guard[path || '$default'], params);
                }
                if (value.$switch) {
                    const key = get(params, value.$switch);
                    const values = value[value.$switch];
                    return this._resolve(getProperty(values, key), params);
                }
                if (deep) {
                    return Object.keys(value).reduce((result, key) => {
                        result[key] = this._resolve(value[key], params, true);
                        return result;
                    }, {});
                }
            }
        }

        return value;
    }
}

function get(object, path) {
    path = path.split('.');
    const length = path.length;
    let index = 0;

    while (object != null && index < length) {
        object = object[path[index++]];
    }

    return object;
}

function getProperty(object, key) {
    return object[object[key] === undefined ? '$default' : key];
}

module.exports = Config;
