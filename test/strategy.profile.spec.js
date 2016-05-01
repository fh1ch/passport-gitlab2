var expect = require('chai').expect;
var GitLabStrategy = require('../lib/strategy');

describe('Profile', function() {

  describe('fetched from default endpoint', function() {
    var profile;

    var strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});

    strategy._oauth2.get = function(url, accessToken, callback) {
      if (url !== 'https://gitlab.com/api/v3/user') {
        return callback(new Error('incorrect url argument'));
      }
      if (accessToken !== 'token') {
        return callback(new Error('incorrect token argument'));
      }

      var body = JSON.stringify({
        // jshint camelcase: false
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        id: 1,
        name: 'John Smith',
        username: 'john_smith',
        state: 'active',
        avatar_url: 'https://gitlab.com/uploads/user/avatar/1/index.jpg',
        web_url: 'https://gitlab.com/u/john_smith',
        created_at: '2012-05-23T08:00:58Z',
        is_admin: false,
        bio: '',
        location: '',
        skype: '',
        linkedin: '',
        twitter: '',
        website_url: '',
        last_sign_in_at: '2012-09-23T08:00:58Z',
        confirmed_at: '2012-06-23T08:00:58Z',
        email: 'john@example.com',
        theme_id: 4,
        color_scheme_id: 5,
        projects_limit: 100000,
        current_sign_in_at: '2012-010-23T08:00:58Z',
        identities: [],
        can_create_group: true,
        can_create_project: true,
        two_factor_enabled: true,
        external: false,
        private_token: 'dd34asd13as'
        // jshint camelcase: true
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      });

      callback(null, body, undefined);
    };

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) {
          return done(err);
        }
        profile = p;
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('gitlab');
      expect(profile.id).to.equal('1');
      expect(profile.username).to.equal('john_smith');
      expect(profile.displayName).to.equal('John Smith');
      expect(profile.emails[0].value).to.equal('john@example.com');
      expect(profile.avatarUrl).to.equal('https://gitlab.com/uploads/user/avatar/1/index.jpg');
      expect(profile.profileUrl).to.equal('https://gitlab.com/u/john_smith');
    });

    it('should set raw property', function() {
      expect(profile._raw).to.be.a('string');
    });

    it('should set json property', function() {
      expect(profile._json).to.be.an('object');
    });
  });

  describe('error caused by invalid token', function() {
    var err;
    var profile;

    var strategy =  new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});

    strategy._oauth2.get = function(url, accessToken, callback) {
      var body = JSON.stringify({
        error: {
          message: 'Invalid OAuth access token.',
          type: 'OAuthException',
          code: 190,
          fbtraceid: 'XxXXXxXxX0x'
        }
      });

      callback({statusCode: 400, data: body});
    };

    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch user profile');
    });
  });

  describe('error caused by malformed response', function() {
    var err;
    var profile;

    var strategy =  new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});

    strategy._oauth2.get = function(url, accessToken, callback) {
      var body = 'Hello, world.';
      callback(null, body, undefined);
    };

    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Failed to parse user profile');
    });
  });

  describe('internal error', function() {
    var err;
    var profile;

    var strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    }, function() {});

    strategy._oauth2.get = function(url, accessToken, callback) {
      return callback(new Error('something went wrong'));
    };

    before(function(done) {
      strategy.userProfile('wrong-token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch user profile');
      expect(err.oauthError).to.be.an.instanceOf(Error);
      expect(err.oauthError.message).to.equal('something went wrong');
    });

    it('should not load profile', function() {
      expect(profile).to.be.an('undefined');
    });
  });

});
