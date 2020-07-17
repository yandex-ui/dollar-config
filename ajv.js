'use strict';

const { v5: uuidv5 } = require('uuid');
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
        minItems: 2,
        maxItems: 2,
        items: [ { type: 'string' }, { $ref } ]
    };
    const anyAndRef = {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: [ {}, { $ref } ]
    };
    const template = {
        allOf: stringAndRef.items
    };
    const properties = {
        $param: {
            oneOf: [
                { type: 'string' },
                stringAndRef
            ]
        },
        $template: {
            oneOf: [
                template,
                { type: 'array', items: template }
            ]
        },
        $guard: {
            type: 'array',
            items: stringAndRef
        },
        $switch: {
            type: 'array',
            minItems: 2,
            maxItems: 2,
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
