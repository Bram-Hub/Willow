const db = require('../util/db');
const mailer = require('../util/mailer');

const pug = require('pug');

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
          reset_invalid_link: 'The password reset link you attempted to open ' +
              'is invalid. Request another password reset by choosing the ' +
              '"Forgot your password?" option below.',
          reset_no_account: 'There is no account with that email address.',
          reset_no_email: 'You must provide the email address for the account' +
              'whose password you would like to reset.',
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

/**
 * Deletes expired rows from the `password_resets` table in the database.
 */
async function deleteExpiredRows() {
  await db.pool.query(`
      DELETE FROM password_resets
      WHERE expires_at > CURRENT_TIMESTAMP
  `);
}

exports['forgot-password'] = {
  /**
   * POST /auth/forgot-password
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async post(req, res) {
    const {email} = req.body;

    // The `email` parameter is required
    if (!email) {
      res.redirect('/auth/login?error=reset_no_email');
      return;
    }

    let token;
    try {
      // Generate a new UUID
      await db.pool.query(`
          DELETE FROM password_resets
          WHERE email = $1
      `, [email]);
      token = (await db.pool.query(`
          INSERT INTO password_reset (email)
          VALUES ($1)
          RETURNING token;
      `, [email])).rows[0].token;
    } catch (err) {
      res.redirect('/auth/login?error=reset_no_account');
      return;
    }

    // Send the password reset email to the provided email address
    await mailer.transporter.sendMail({
      from: `Willow <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password | Willow',
      html: pug.renderFile('./views/templates/password-reset.pug', {
        baseUrl: process.env.BASE_URL,
        token: token,
      }),
    });
  },
};

exports.reset = {
  /**
   * GET /auth/reset
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async get(req, res) {
    const {token} = req.query;
    // The `token` parameter is required
    if (!token) {
      res.redirect('/auth/login?error=reset_invalid_link');
      return;
    }

    const expiresAt = (await db.pool.query(`
        SELECT expires_at
        FROM password_resets
        WHERE token = $1
    `, [token]));
    if (!expiresAt || new Date() > expiresAt) {
      res.redirect('/auth/login?error=reset_expired');
      return;
    }

    // Prompt the user for a new password
    res.render('/auth/reset', {
      token: token,
    });
  },

  /**
   * POST /auth/reset
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async post(req, res) {
    const {password, token} = req.body;
    if (!password || !token) {
      res.redirect('/auth/login?error=reset_no_password');
      return;
    }

    const {email, expiresAt} = (await db.pool.query(`
        SELECT email, expiresAt
        FROM password_resets
        WHERE token = $1
    `, [token])).rows[0];


    await db.pool.query(`
        UPDATE users
        SET password = crypt($1, gen_salt('bf'))
        WHERE email = $2
    `, []);
  },
};
