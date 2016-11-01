var url                 = require('url');
var util                = require('util');
var OAuth2Strategy      = require('passport-oauth2');
var InternalOAuthError  = require('passport-oauth2').InternalOAuthError;

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
 *         clientSecret: 'shhh-its-a-secret',
 *         includeAllEmails: true, // optional - to retrieve all user email addresses
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
  options.scope = options.scope || 'api';
  options.scopeSeparator = options.scopeSeparator || ',';

  OAuth2Strategy.call(this, options, verify);
  this.name = 'gitlab';
  this._profileURL = options.profileURL || url.resolve(this._baseURL, 'api/v3/user');
  this._includeAllEmails = options.includeAllEmails || false;
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
 *   - `avatarUrl`        the URL of the GitLab profile picture
 *   - `profileUrl`       the URL to the GitLab profile of the user
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var self = this;

  self._oauth2.get(self._profileURL, accessToken, function(err, body) {
    var json;

    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = {
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

    profile.provider  = 'gitlab';
    profile._raw = body;
    profile._json = json;

    if (self._includeAllEmails) {
      self._oauth2.get(self._profileURL + '/emails' , accessToken, function(err, body) {
        if (err) {
          console.log('Failed to retrieve email address from Gitlab', err);
          return done(null, profile);
        }

        var jsonArray;
        try {
          jsonArray = JSON.parse(body);
        } catch (_) {
          // If the attempt to parse email addresses fails, return the profile
          // information that was obtained.
          console.log('Error parsing response from Gitlab for user email addresses');
          return done(null, profile);
        }

        if (!jsonArray.length) { // Means user has just one email address
          return done(null, profile);
        }

        profile.emails[0].primary = true;
        (jsonArray).forEach(function(email) {
          profile.emails.push({value: email.email, primary: email.email === profile.emails[0].value});
        });

        done(null, profile);
      });
    } else {
      done(null, profile);
    }
  });
};

// Expose constructor
module.exports = Strategy;
