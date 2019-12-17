const url = require('url');
const util = require('util');
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;

/**
 * Strategy constructor
 *
 * The GitLab authentication strategy authenticates requests by delegating to
 * GitLab using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your GitLab application's App ID
 *   - `clientSecret`  your GitLab application's App Secret
 *   - `callbackURL`   URL to which GitLab will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new GitLabStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/gitlab/callback'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  this._baseURL = options.baseURL || 'https://gitlab.com';
  options.authorizationURL = options.authorizationURL || url.resolve(this._baseURL, 'oauth/authorize');
  options.tokenURL = options.tokenURL || url.resolve(this._baseURL, 'oauth/token');
  options.scope = options.scope || 'read_user';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'gitlab';
  this._profileURL = options.profileURL || url.resolve(this._baseURL, 'api/v4/user');
  this._groupsURL = options.groupsURL || url.resolve(this._baseURL, 'api/v4/groups?min_access_level=10');
  this._oauth2.useAuthorizationHeaderforGET(true);
}

// Inherit from OAuth2Strategy
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from GitLab
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `gitlab`
 *   - `id`               the user's GitLab ID
 *   - `username`         the user's GitLab username
 *   - `displayName`      the user's full name
 *   - `emails`           the proxied or contact email address granted by the user
 *   - `groups`           the user's groups
 *   - `avatarUrl`        the URL of the GitLab profile picture
 *   - `profileUrl`       the URL to the GitLab profile of the user
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  const self = this;

  self._oauth2.get(self._profileURL, accessToken, function(err, body) {
    let json;

    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    const profile = {
      id: String(json.id),
      username: json.username,
      displayName: json.name,
      emails: [{value: json.email}],
      // jshint camelcase: false
      // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      avatarUrl: json.avatar_url,
      profileUrl: json.web_url
      // jshint camelcase: true
      // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
    };

    profile.provider = 'gitlab';
    profile._raw = body;
    profile._json = json;

    if (self._scope.includes('api')) {
      self._oauth2.get(self._groupsURL, accessToken, function(err, body) {
        let jsonGroups;

        if (err) {
          return done(new InternalOAuthError('Failed to fetch groups of user', err));
        }

        try {
          jsonGroups = JSON.parse(body);
        } catch (ex) {
          return done(new Error('Failed to parse groups of user'));
        }

        profile.groups = jsonGroups.map((g) => g.name);

        done(null, profile);
      });
    } else {
      done(null, profile);
    }
  });
};

// Expose constructor
module.exports = Strategy;
