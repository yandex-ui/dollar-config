'use strict';

const isPlainObject = require('lodash/isPlainObject');

const DELIMITER = '.';

/**
 * Recursively flattens object keys.
 * Unlike in `flat`, nested objects are flattened AND included in result.
 *
 * @param {object} object - Input object.
 * @returns {object} Object with flattened keys.
 */
function flatten(object) {
    return Object.keys(object).reduce(assign.bind(null, object, ''), {});
}

/**
 * Adds item to source object with given prefix.
 *
 * @param {object} source - Source object.
 * @param {string} prefix - Current prefix.
 * @param {object} target - Target object.
 * @param {string} key - Item key in source object.
 * @returns {object} Target object with flattened keys.
 */
function assign(source, prefix, target, key) {
    const item = source[key];
    const newKey = prefix + key;
    target[newKey] = item;

    if (isPlainObject(item)) {
        return Object.keys(item).reduce(assign.bind(null, item, newKey + DELIMITER), target);
    }

    return target;
}

module.exports = flatten;
