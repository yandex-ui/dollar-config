'use strict';

const Ajv = require('ajv');
const ajv = require('../ajv')(new Ajv());
const validate = ajv.compile({ dynamic: { type: 'number' } });

describe('ajvDynamic', () => {
    it('validates static value', () => {
        expect(validate(1)).to.be.true;
        expect(validate('1')).to.be.false;
    });

    describe('for original schema', () => {
        it('passes empty schema', () => {
            const validate = ajv.compile({ dynamic: {} });
            expect(validate(1)).to.be.true;
        });

        it('fails schemas with $-keywords', () => {
            const validate = ajv.compile({
                dynamic: { type: 'object', properties: { $param: {} } }
            });
            expect(validate({ $param: null })).to.be.false;
        });
    });

    describe('for $param', () => {
        it('passes reference to param', () => {
            expect(validate({ $param: 'foo' })).to.be.true;
        });

        it('passes static default value', () => {
            expect(validate({ $param: [ 'foo', 1 ] })).to.be.true;
        });

        it('passes dynamic default value', () => {
            expect(validate({ $param: [ 'foo', { $param: 'bar' } ] })).to.be.true;
        });

        it('fails non-string param name', () => {
            expect(validate({ $param: 1 })).to.be.false;
        });

        it('fails default value not matching original schema', () => {
            expect(validate({ $param: [ 'foo', '1' ] })).to.be.false;
        });
    });

    describe('for $template', () => {
        it('passes if original schema is string', () => {
            const validate = ajv.compile({ dynamic: { type: 'string' } });
            expect(validate({ $template: '${foo}' })).to.be.true;
        });

        it('fails if original schema is not string', () => {
            expect(validate({ $template: '${foo}' })).to.be.false;
        });
    });

    describe('for $guard', () => {
        it('passes static values', () => {
            expect(validate({ $guard: [ [ 'foo', 1 ] ] })).to.be.true;
        });
        it('passes dynamic values', () => {
            expect(validate({ $guard: [ [ 'foo', { $param: 'bar' } ] ] })).to.be.true;
        });
        it('fails non-string param names', () => {
            expect(validate({ $guard: [ [ 0, 1 ] ] })).to.be.false;
        });
        it('fails values not matching original schema', () => {
            expect(validate({ $guard: [ [ 'foo', '1' ] ] })).to.be.false;
        });
    });

    describe('for $switch', () => {
        it('passes static values', () => {
            expect(validate({ $switch: [ 'foo', [ [ 'bar', 1 ] ] ] })).to.be.true;
        });
        it('passes dynamic values', () => {
            expect(validate({ $switch: [ 'foo', [ [ 'bar', { $param: 'baz' } ] ] ] })).to.be.true;
        });
        it('passes non-string param values', () => {
            expect(validate({ $switch: [ 'foo', [ [ 0, 1 ] ] ] })).to.be.true;
        });
        it('fails non-string param names', () => {
            expect(validate({ $switch: [ 0, [ [ 'bar', 1 ] ] ] })).to.be.false;
        });
        it('fails values not matching original schema', () => {
            expect(validate({ $switch: [ 'foo', [ [ 'bar', '1' ] ] ] })).to.be.false;
        });
    });

    describe('for $function', () => {
        it('passes string function names', () => {
            expect(validate({ $function: 'foo' })).to.be.true;
        });

        it('fails non-string function names', () => {
            expect(validate({ $function: 1 })).to.be.false;
        });
    });

    it('caches created schemas', () => {
        const validate = ajv.compile({
            type: 'object',
            properties: {
                foo: { dynamic: { type: 'number' } },
                bar: { dynamic: { type: 'number' } }
            }
        });
        expect(validate.refs).to.eql({ '/c814f144-cb8d-5269-93c4-da79a8b2f6cd': 1 });
    });
});
