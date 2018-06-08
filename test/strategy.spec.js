var expect          = require('chai').expect;
var GitLabStrategy  = require('../lib/strategy');

describe('Strategy', function() {

  describe('constructed', function() {
    var strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});

    it('should be named gitlab', function() {
      expect(strategy.name).to.equal('gitlab');
    });
  });

  describe('constructed with custom baseURL', function() {
    var strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      baseURL: 'https://example.com/gl/'
    }, function() {});

    it('should have correct profile URL', function() {
      expect(strategy._profileURL).to.equal('https://example.com/gl/api/v4/user');
    });
  });

  describe('constructed with undefined options', function() {
    it('should throw', function() {
      expect(function() {
        //jshint unused:false
        var strategy = new GitLabStrategy(undefined, function() {});
      }).to.throw(Error);
    });
  });

});
