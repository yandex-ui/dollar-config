'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const deepExtend = require('deep-extend');

const EXTENDS_KEY = '$extends';

/**
 * Loads config and merges with it's parents.
 *
 * @param {String} filename - Path to config.
 * @returns {Object} - Resulting config.
 */
function loadConfig(filename) {
    let config = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));

    if (config[EXTENDS_KEY]) {
        const filedir = path.dirname(filename);
        const parents = [].concat(config[EXTENDS_KEY]);
        const configs = parents.map((parent) => {
            const filename = path.resolve(filedir, parent);
            return loadConfig(filename);
        });
        // Merge config with it's parents.
        // eslint-disable-next-line prefer-spread
        config = deepExtend.apply(undefined, [ {} ].concat(configs, config));
        // Remove utility field.
        delete config[EXTENDS_KEY];
    }

    return config;
}

module.exports = loadConfig;
