const db = require('../util/db');

exports.login = {
  /**
   * GET /auth/login
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  get(req, res) {
    res.render('auth/login', {
      msg: {
        error: {
          duplicate_email: 'An account with this email address already ' +
              'exists. To recover this account, choose the "Forgot your ' +
              'password?" option below.',
          incorrect_credentials: 'The username or password you entered was ' +
              'incorrect.',
        }[req.query.error],
      },
    });
  },

  /**
   * POST /auth/login
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async post(req, res) {
    const {email, password} = req.body;
    const rememberMe = 'remember_me' in req.body;

    const {authenticated} = (await db.pool.query(`
        SELECT EXISTS(
            SELECT 1
            FROM users
            WHERE email = $1 AND password = crypt($2::TEXT, password)
        ) AS authenticated
    `, [email, password])).rows[0];

    if (!authenticated) {
      res.redirect('/auth/login?error=incorrect_credentials');
      return;
    }

    // If the client was authenticated, then initialize the session
    req.session.email = email;
    if (rememberMe) {
      // If "Remember me" was checked, then make the cookie last for 30 days
      req.session.maxAge = 1000 * 60 * 60 * 24 * 30;
    }
    // Redirect to the homepage after the user is logged in
    res.redirect('/');
  },
};

/**
 * GET /auth/logout
 * @param {express.Request} req the request sent from the client
 * @param {express.Response} res the response sent back to the client
 */
exports.logout = async function(req, res) {
  req.session.destroy((err) => {
    res.redirect('/auth/login');
  });
};

exports.register = {
  /**
   * GET /auth/register
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  get(req, res) {
    res.render('auth/register');
  },

  /**
   * POST /auth/register
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async post(req, res) {
    const {email, password} = req.body;

    try {
      await db.pool.query(`
          INSERT INTO users
          VALUES ($1, crypt($2, gen_salt('bf')))
      `, [email, password]);
    } catch (err) {
      // If the above query throws an error, then there must have been a
      // duplicate primary key (email)
      res.redirect('/auth/login?error=duplicate_email');
      return;
    }

    // If the registration was successful, then redirect the user to the login
    // page
    res.redirect('/auth/login');
  },
};
