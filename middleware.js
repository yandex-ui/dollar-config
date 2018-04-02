'use strict';

const DollarConfig = require('./index.js');

function middlewareFactory(config) {
    if (!(config instanceof DollarConfig)) {
        config = new DollarConfig(config);
    }

    return (req, res, next) => {
        req.config = config.bind(req);
        next();
    };
}

module.exports = middlewareFactory;
