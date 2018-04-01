'use strict';

const DollarConfig = require('../index.js');
const middleware = require('../middleware');

describe('middleware', () => {
    it('creates req.config', () => {
        const req = { foo: 1 };
        const config = { bar: { $param: 'foo' } };
        const next = sinon.stub();

        middleware(config)(req, null, next);

        expect(req.config.get('bar')).to.equal(1);
        expect(next).to.have.been.called;
    });

    it('accepts dollar config instance', () => {
        const req = { foo: 1 };
        const config = new DollarConfig({ bar: { $param: 'foo' } });
        const next = sinon.stub();

        middleware(config)(req, null, next);

        expect(req.config.get('bar')).to.equal(1);
        expect(next).to.have.been.called;
    });
});
