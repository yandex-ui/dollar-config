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
            const result = value[path[index++]];
            value = result === undefined ? value.$default : result;
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
                if (value.$param) {
                    if (typeof value.$param === 'string') {
                        return get(params, value.$param);
                    }
                    const result = get(params, value.$param[0]);
                    return result === undefined ? this._resolve(value.$param[1], params) : result;
                }
                if (value.$template) {
                    return value.$template.replace(/\$\{([^}]+)\}/g, (_, path) => get(params, path));
                }
                if (value.$guard) {
                    const item = find(value.$guard, (item) => item[0] === '$default' || get(params, item[0]));
                    return item && this._resolve(item[1], params);
                }
                if (value.$switch) {
                    const key = get(params, value.$switch[0]);
                    const item = find(value.$switch[1], (item) => item[0] === key || item[0] === '$default');
                    return item && this._resolve(item[1], params);
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

// shim for IE
function find(array, callback) {
    let result;
    array.some((item) => {
        if (callback(item)) {
            result = item;
            return true;
        }
        return false;
    });
    return result;
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

module.exports = Config;
