'use strict';

const flatten = require('../lib/flatten.js');

describe('flatten', () => {
    it('flattens object keys', () => {
        const object = {
            foo: 1,
            bar: {
                baz: 2
            }
        };

        expect(flatten(object)).to.eql({
            'foo': 1,
            'bar': { baz: 2 },
            'bar.baz': 2
        });
    });

    it('does not flatten arrays', () => {
        const object = {
            foo: [ 1, 2 ]
        };

        expect(flatten(object)).to.eql({
            foo: [ 1, 2 ]
        });
    });
});
