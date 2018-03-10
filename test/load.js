'use strict';

const proxyquire = require('proxyquire').noCallThru();

describe('loadConfig', () => {
    it('loads config', () => {
        const readFileSync = sinon.stub().returns('abc: 1');
        const loadConfig = proxyquire('../load', { fs: { readFileSync } });
        const config = loadConfig('/foo');

        expect(config).to.eql({ abc: 1 });
    });

    it('loads config with a parent', () => {
        const readFileSync = sinon.stub();
        readFileSync.withArgs('/foo').returns('$extends: /bar\nabc: 1');
        readFileSync.withArgs('/bar').returns('abc: 2\ndef: 3');
        const loadConfig = proxyquire('../load', { fs: { readFileSync } });
        const config = loadConfig('/foo');

        expect(config).to.eql({ abc: 1, def: 3 });
    });

    it('loads config with multiple parents', () => {
        const readFileSync = sinon.stub();
        readFileSync.withArgs('/foo').returns('$extends: [/baz, /bar]\nabc: 1');
        readFileSync.withArgs('/bar').returns('abc: 2\ndef: 3');
        readFileSync.withArgs('/baz').returns('abc: 4\ndef: 5\nghi: 6');
        const loadConfig = proxyquire('../load', { fs: { readFileSync } });
        const config = loadConfig('/foo');

        expect(config).to.eql({ abc: 1, def: 3, ghi: 6 });
    });

    it('loads config with grandparents', () => {
        const readFileSync = sinon.stub();
        readFileSync.withArgs('/foo').returns('$extends: /bar\nabc: 1');
        readFileSync.withArgs('/bar').returns('$extends: /baz\nabc: 2\ndef: 3');
        readFileSync.withArgs('/baz').returns('abc: 4\ndef: 5\nghi: 6');
        const loadConfig = proxyquire('../load', { fs: { readFileSync } });
        const config = loadConfig('/foo');

        expect(config).to.eql({ abc: 1, def: 3, ghi: 6 });
    });
});
