const expect = require('chai').expect;
const GitLabStrategy = require('../lib/strategy');

/**
 * This function wraps the mock for the default strategy._oauth.get function.
 * It provides the option to configure the moc function to behave in specific ways.
 *
 * @param{object} config The config object
 * @return {function} The adapted function
 */
function oAuthGetReplacementClosure(config) {
  return function(url, accessToken, callback) {
    if (!['https://gitlab.com/api/v4/user', 'https://gitlab.com/api/v4/groups?min_access_level=10'].includes(url)) {
      return callback(new Error('incorrect url argument'));
    }
    if (accessToken !== 'token') {
      return callback(new Error('incorrect token argument'));
    }

    if (url === 'https://gitlab.com/api/v4/user') {
      let body;
      if (config.userError === 'none') {
        body = JSON.stringify({
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
      } else if (config.userError === 'invalidToken') {
        body = JSON.stringify({
          error: {
            message: 'Invalid OAuth access token.',
            type: 'OAuthException',
            code: 190,
            fbtraceid: 'XxXXXxXxX0x'
          }
        });

        return callback({statusCode: 400, data: body});
      } else if (config.userError === 'malformedResponse') {
        body = 'Hello World.';
      } else if (config.userError === 'internalError') {
        return callback(new Error('something went wrong'));
      }

      callback(null, body, undefined);
    } else if (url === 'https://gitlab.com/api/v4/groups?min_access_level=10') {
      let body;
      if (config.groupsError === 'none') {
        body = JSON.stringify([
          {
            id: 0,
            name: 'groupA',
            path: 'groupA',
            description: '',
            visibility: 'private',
            lfs_enabled: true,
            avatar_url: null,
            web_url: 'https://gitlab.com/groups/groupA',
            request_access_enabled: false,
            full_name: 'groupA',
            full_path: 'groupA'
          }, {
            id: 1,
            name: 'groupB',
            path: 'groupB',
            description: '',
            visibility: 'private',
            lfs_enabled: true,
            avatar_url: null,
            web_url: 'https://gitlab.com/groups/groupB',
            request_access_enabled: false,
            full_name: 'groupB',
            full_path: 'groupB'
          }
        ]);
      } else if (config.groupsError === 'malformedResponse') {
        body = 'Hello World.';
      } else if (config.groupsError === 'internalError') {
        return callback(new Error('something went wrong'));
      }
      callback(null, body, undefined);
    }
  };
}

describe('Profile', function() {
  describe('fetched from default endpoint using read_user scope', function() {
    let profile;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'none',
      groupsError: 'none'
    });

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

    it('should not have property groups', function() {
      expect(profile).to.not.have.property('groups');
    });
  });

  describe('fetched from default endpoint using `read_user` and `api` scope', function() {
    let profile;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user api'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'none',
      groupsError: 'none'
    });

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) {
          return done(err);
        }
        profile = p;
        done();
      });
    });

    it('should have property groups', function() {
      expect(profile).to.have.property('groups');
    });

    it('should parse groups', function() {
      expect(profile.groups).to.eql(['groupA', 'groupB']);
    });
  });

  describe('error caused by invalid token', function() {
    let err;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'invalidToken'
    });

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

  describe('error caused by malformed response at read profile', function() {
    let err;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'malformedResponse'
    });

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

  describe('error caused by malformed response at read groups', function() {
    let err;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user api'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'none',
      groupsError: 'malformedResponse'
    });

    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('Failed to parse groups of user');
    });
  });

  describe('internal error at read profile', function() {
    let err;
    let profile;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'internalError'
    });

    before(function(done) {
      strategy.userProfile('token', function(e, p) {
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

  describe('internal error at read groups', function() {
    let err;
    let profile;

    const strategy = new GitLabStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret',
      scope: 'read_user api'
    }, function() {
    });

    strategy._oauth2.get = oAuthGetReplacementClosure({
      userError: 'none',
      groupsError: 'internalError'
    });

    before(function(done) {
      strategy.userProfile('token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch groups of user');
      expect(err.oauthError).to.be.an.instanceOf(Error);
      expect(err.oauthError.message).to.equal('something went wrong');
    });

    it('should not load profile', function() {
      expect(profile).to.be.an('undefined');
    });
  });
});
