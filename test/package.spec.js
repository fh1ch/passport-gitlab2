const expect = require('chai').expect;
const strategy = require('..');

describe('passport-gitlab', function() {
  it('should export Strategy constructor', function() {
    expect(strategy.Strategy).to.be.a('function');
  });

  it('should export Strategy constructor as module', function() {
    expect(strategy).to.be.a('function');
    expect(strategy).to.equal(strategy.Strategy);
  });
});
