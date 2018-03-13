'use strict';

const Config = require('../');

describe('DollarConfig', () => {
    describe('get', () => {
        describe('for root properties', () => {
            it('returns value', () => {
                const config = new Config({
                    foo: 'bar'
                });
                expect(config.get('foo')).to.equal('bar');
            });

            it('returns value by array path', () => {
                const config = new Config({
                    foo: 'bar'
                });
                expect(config.get([ 'foo' ])).to.equal('bar');
            });

            it('returns undefined', () => {
                const config = new Config({});
                expect(config.get('foo')).to.be.undefined;
            });

            it('returns null', () => {
                const config = new Config({
                    foo: null
                });
                expect(config.get('foo')).to.be.null;
            });
        });

        describe('for nested properties', () => {
            it('returns value', () => {
                const config = new Config({
                    foo: {
                        bar: 'baz'
                    }
                });
                expect(config.get('foo.bar')).to.equal('baz');
            });

            it('returns value by array path', () => {
                const config = new Config({
                    foo: {
                        bar: 'baz'
                    }
                });
                expect(config.get([ 'foo', 'bar' ])).to.equal('baz');
            });

            it('returns undefined', () => {
                const config = new Config({
                    foo: {}
                });
                expect(config.get('foo.bar')).to.be.undefined;
            });

            it('returns intermediate undefined', () => {
                const config = new Config({});
                expect(config.get('foo.bar')).to.be.undefined;
            });

            it('returns null', () => {
                const config = new Config({
                    foo: {
                        bar: null
                    }
                });
                expect(config.get('foo.bar')).to.be.null;
            });

            it('returns intermediate null', () => {
                const config = new Config({
                    foo: null
                });
                expect(config.get('foo.bar')).to.be.null;
            });
        });

        describe('for properties with $default', () => {
            it('returns default value', () => {
                const config = new Config({
                    foo: {
                        $default: 'oops',
                        bar: 'baz'
                    }
                });
                expect(config.get('foo.whatever')).to.equal('oops');
            });
        });

        describe('for properties with $param', () => {
            it('returns referenced param', () => {
                const config = new Config({
                    foo: {
                        $param: 'bar'
                    }
                });
                expect(config.get('foo', { bar: 'baz' })).to.equal('baz');
            });

            it('returns array item with referenced param', () => {
                const config = new Config({
                    foo: [
                        {
                            $param: 'bar'
                        }
                    ]
                });
                expect(config.get('foo.0', { bar: 'baz' })).to.equal('baz');
            });

            it('returns default value', () => {
                const config = new Config({
                    foo: {
                        $default: 'oops',
                        $param: 'bar'
                    }
                });
                expect(config.get('foo', {})).to.equal('oops');
            });

            it('returns resolved default value', () => {
                const config = new Config({
                    foo: {
                        $default: {
                            $param: 'baz'
                        },
                        $param: 'bar'
                    }
                });
                expect(config.get('foo', { baz: 'qux' })).to.equal('qux');
            });
        });

        describe('for properties with $template', () => {
            it('returns computed value', () => {
                const config = new Config({
                    foo: {
                        $template: '${bar}/${qux}'
                    }
                });
                expect(config.get('foo', { bar: 'baz', qux: 'xyz' })).to.equal('baz/xyz');
            });
        });

        describe('for properties with $guard', () => {
            describe('when finds a truthy param', () => {
                it('returns correspondent value', () => {
                    const config = new Config({
                        foo: {
                            $guard: {
                                abc: 'bar',
                                def: 'baz'
                            }
                        }
                    });
                    expect(config.get('foo', { def: 1 })).to.equal('baz');
                });

                it('returns resolved correspondent value', () => {
                    const config = new Config({
                        foo: {
                            $guard: {
                                abc: 'bar',
                                def: {
                                    $param: 'ghi'
                                }
                            }
                        }
                    });
                    expect(config.get('foo', { def: 1, ghi: 'baz' })).to.equal('baz');
                });
            });

            describe('otherwise', () => {
                it('returns default value', () => {
                    const config = new Config({
                        foo: {
                            $guard: {
                                abc: 'bar',
                                $default: 'oops'
                            }
                        }
                    });
                    expect(config.get('foo', {})).to.equal('oops');
                });

                it('returns resolved default value', () => {
                    const config = new Config({
                        foo: {
                            $guard: {
                                abc: 'bar',
                                $default: {
                                    $param: 'ghi'
                                }
                            }
                        }
                    });
                    expect(config.get('foo', { def: 1, ghi: 'baz' })).to.equal('baz');
                });
            });
        });

        describe('for properties with $switch', () => {
            describe('when finds a matching param value', () => {
                it('returns correspondent value', () => {
                    const config = new Config({
                        foo: {
                            $switch: 'abc',
                            abc: {
                                def: 'bar',
                                ghi: 'baz'
                            }
                        }
                    });
                    expect(config.get('foo', { abc: 'ghi' })).to.equal('baz');
                });

                it('returns resolved correspondent value', () => {
                    const config = new Config({
                        foo: {
                            $switch: 'abc',
                            abc: {
                                def: 'bar',
                                ghi: {
                                    $param: 'jkl'
                                }
                            }
                        }
                    });
                    expect(config.get('foo', { abc: 'ghi', jkl: 'baz' })).to.equal('baz');
                });
            });

            describe('otherwise', () => {
                it('returns default value', () => {
                    const config = new Config({
                        foo: {
                            $switch: 'abc',
                            abc: {
                                def: 'bar',
                                $default: 'oops'
                            }
                        }
                    });
                    expect(config.get('foo', { abc: 'ghi' })).to.equal('oops');
                });

                it('returns resolved default value', () => {
                    const config = new Config({
                        foo: {
                            $switch: 'abc',
                            abc: {
                                def: 'bar',
                                $default: {
                                    $param: 'jkl'
                                }
                            }
                        }
                    });
                    expect(config.get('foo', { abc: 'ghi', jkl: 'baz' })).to.equal('baz');
                });
            });
        });

        describe('when returning object-like value', () => {
            it('recursively resolves objects', () => {
                const config = new Config({
                    foo: {
                        $param: 'abc'
                    }
                });
                expect(config.get([], { abc: 'bar' })).to.eql({ foo: 'bar' });
            });

            it('recursively resolves arrays', () => {
                const config = new Config({
                    foo: [
                        {
                            $param: 'abc'
                        }
                    ]
                });
                expect(config.get([], { abc: 'bar' })).to.eql({ foo: [ 'bar' ] });
            });
        });
    });
});
