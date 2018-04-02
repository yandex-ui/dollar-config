'use strict';

const uuidv5 = require('uuid/v5');
const DEFAULT_SCHEMA_ID = 'http://json-schema.org/schema';

function dynamic(ajv) {
    ajv.addKeyword('dynamic', {
        macro,
        metaSchema: ajv.getSchema(DEFAULT_SCHEMA_ID).schema
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
    const stringAndRef = {
        type: 'array',
        items: [ { type: 'string' }, { $ref } ]
    };
    const anyAndRef = {
        type: 'array',
        items: [ {}, { $ref } ]
    };
    const properties = {
        $param: {
            oneOf: [
                { type: 'string' },
                stringAndRef
            ]
        },
        $template: {
            allOf: stringAndRef.items
        },
        $guard: {
            type: 'array',
            items: stringAndRef
        },
        $switch: {
            type: 'array',
            items: [
                { type: 'string' },
                { type: 'array', items: anyAndRef }
            ]
        },
        $function: {
            type: 'string'
        }
    };
    const requiredKeys = Object.keys(properties).map((key) => {
        return { required: [ key ] };
    });

    return {
        oneOf: [
            {
                allOf: [
                    schema,
                    { not: { type: 'object', anyOf: requiredKeys } }
                ]
            },
            {
                type: 'object',
                additionalProperties: false,
                properties,
                oneOf: requiredKeys
            }
        ]
    };
}

module.exports = dynamic;
