'use strict';

module.exports = {
    root: true,
    extends: [
        'eslint:recommended',
        'yandex-personal/es6',
        'yandex-personal/jsdoc'
    ],
    env: {
        node: true
    },
    overrides: [
        {
            files: 'test/*.js',
            env: {
                mocha: true
            },
            globals: {
                expect: true,
                sinon: true
            },
            rules: {
                'no-unused-expressions': 'off'
            }
        }
    ]
};
