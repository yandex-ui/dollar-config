'use strict';

const build = require('../build');

describe('build', () => {
    it('resolved objects', () => {
        const result = build({ foo: 1, bar: { $param: 'baz' } }, { baz: 2 });
        expect(result).to.eql({ foo: 1, bar: 2 });
    });

    it('resolved arrays', () => {
        const result = build({ foo: [ { $param: 'bar' } ] }, { bar: 1 });
        expect(result).to.eql({ foo: [ 1 ] });
    });

    describe('for $param', () => {
        it('inlines matching param value', () => {
            const result = build({ $param: 'foo' }, { foo: 1 });
            expect(result).to.equal(1);
        });

        it('inlines nested param value', () => {
            const result = build({ $param: 'foo.bar' }, { foo: { bar: 1 } });
            expect(result).to.equal(1);
        });

        it('proxies non-matching param value', () => {
            const result = build({ $param: 'foo' }, {});
            expect(result).to.eql({ $param: 'foo' });
        });

        it('inlines param value with a default', () => {
            const result = build({ $param: [ 'foo', 2 ] }, { foo: 1 });
            expect(result).to.equal(1);
        });

        it('inlines static default value', () => {
            const result = build({ $param: [ 'foo', 1 ] }, { foo: undefined });
            expect(result).to.equal(1);
        });

        it('inlines matching dynamic default value', () => {
            const result = build({ $param: [ 'foo', { $param: 'bar' } ] }, { foo: undefined, bar: 1 });
            expect(result).to.equal(1);
        });

        it('inlines nonmatching dynamic default value', () => {
            const result = build({ $param: [ 'foo', { $param: 'bar' } ] }, { bar: 1 });
            expect(result).to.eql({ $param: [ 'foo', 1 ] });
        });
    });

    describe('for $template', () => {
        it('inlines matcing templates', () => {
            const result = build({ $template: '${foo}/${bar}' }, { foo: 1, bar: 2 });
            expect(result).to.equal('1/2');
        });

        it('proxies non-matching templates', () => {
            const result = build({ $template: '${foo}/${bar}' }, {});
            expect(result).to.eql({ $template: '${foo}/${bar}' });
        });

        it('modifies non-matching templates', () => {
            const result = build({ $template: '${foo}/${bar}' }, { foo: 1 });
            expect(result).to.eql({ $template: '1/${bar}' });
        });
    });

    describe('for $guard', () => {
        it('inlines test values', () => {
            const result = build(
                {
                    $guard: [
                        [ 'foo', { $param: 'bar' } ],
                        [ '$default', { $param: 'baz' } ]
                    ]
                },
                { bar: 1, baz: 2 }
            );
            expect(result).to.eql({
                $guard: [
                    [ 'foo', 1 ],
                    [ '$default', 2 ]
                ]
            });
        });

        it('inlines a test and cuts following siblings', () => {
            const result = build(
                {
                    $guard: [
                        [ 'foo', 1 ],
                        [ 'bar', 2 ],
                        [ '$default', 3 ]
                    ]
                },
                { bar: 4 }
            );
            expect(result).to.eql({
                $guard: [
                    [ 'foo', 1 ],
                    [ '$default', 2 ]
                ]
            });
        });

        it('inlines a single test', () => {
            const result = build(
                {
                    $guard: [
                        [ 'foo', 1 ],
                        [ '$default', 2 ]
                    ]
                },
                { foo: 3 }
            );
            expect(result).to.equal(1);
        });

        it('inlines undefined value', () => {
            const result = build(
                {
                    $guard: [
                        [ 'foo', 1 ]
                    ]
                },
                { foo: undefined }
            );
            expect(result).to.equal(undefined);
        });
    });

    describe('for $switch', () => {
        it('inlines test values', () => {
            const result = build(
                {
                    $switch: [
                        'foo',
                        [
                            [ 'bar', { $param: 'baz' } ],
                            [ '$default', { $param: 'qux' } ]
                        ]
                    ]
                },
                { baz: 1, qux: 2 }
            );
            expect(result).to.eql({
                $switch: [
                    'foo',
                    [
                        [ 'bar', 1 ],
                        [ '$default', 2 ]
                    ]
                ]
            });
        });

        it('inlines a test', () => {
            const result = build(
                {
                    $switch: [
                        'foo',
                        [
                            [ 'bar', { $param: 'baz' } ],
                            [ '$default', { $param: 'qux' } ]
                        ]
                    ]
                },
                { foo: 'bar', baz: 1, qux: 2 }
            );
            expect(result).to.equal(1);
        });

        it('inlines default value', () => {
            const result = build(
                {
                    $switch: [
                        'foo',
                        [
                            [ 'bar', { $param: 'baz' } ],
                            [ '$default', { $param: 'qux' } ]
                        ]
                    ]
                },
                { foo: 'oops', baz: 1, qux: 2 }
            );
            expect(result).to.equal(2);
        });
    });

    describe('for $function', () => {
        it('adds predefined params', () => {
            const result = build({ $function: 'foo' }, { baz: 1 });
            expect(result).to.eql({ $function: [ 'foo', { baz: 1 } ] });
        });
    });
});
