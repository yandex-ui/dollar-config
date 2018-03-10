'use strict';

const uuidv5 = require('uuid/v5');

function dynamic(ajv) {
    ajv.addKeyword('dynamic', {
        macro,
        metaSchema: ajv.getSchema('http://json-schema.org/schema').schema
    });
    return ajv;
}

function macro(schema, parentSchema, context) {
    const ajv = context.self;
    const $ref = '/' + uuidv5(JSON.stringify(schema), uuidv5.URL);
    if (!ajv.getSchema($ref)) {
        ajv.addSchema(createSchema(schema, $ref), $ref);
    }
    return { $ref };
}

function createSchema(schema, $ref) {
    return {
        oneOf: [
            schema,
            {
                type: 'object',
                required: [ '$ref' ],
                additionalProperties: false,
                properties: {
                    $default: { $ref },
                    $ref: { type: 'string' }
                }
            },
            {
                type: 'object',
                required: [ '$template' ],
                additionalProperties: false,
                properties: {
                    $template: { type: 'string' }
                }
            },
            {
                type: 'object',
                required: [ '$guard' ],
                additionalProperties: false,
                properties: {
                    $guard: {
                        type: 'object',
                        minProperties: 1,
                        additionalProperties: { $ref }
                    }
                }
            },
            {
                type: 'object',
                required: [ '$switch' ],
                minProperties: 2,
                maxProperties: 2,
                properties: {
                    $switch: { type: 'string' }
                },
                additionalProperties: {
                    type: 'object',
                    additionalProperties: { $ref }
                }
            }
        ]
    };
}

module.exports = dynamic;
