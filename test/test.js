// build time tests for jsonbrowser plugin
// see http://mochajs.org/

(function() {
  const jsonbrowser = require('../client/jsonbrowser'),
        expect = require('expect.js');

  describe('jsonbrowser plugin', () => {
    describe('expand', () => {
      it('can make itallic', () => {
        var result = jsonbrowser.expand('hello *world*');
        return expect(result).to.be('hello <i>world</i>');
      });
    });
  });

}).call(this);
