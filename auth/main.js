const db = require('../util/db');

exports.login = {
  /**
   * GET /auth/login
   *
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  get(req, res) {
    res.render('auth/login');
  },

  /**
   * POST /auth/login
   *
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async post(req, res) {
    const {email, password} = req.body;
    const rememberMe = 'rememberMe' in req.body;

    const {authenticated} = (await db.pool.query(`
        SELECT EXISTS(
            SELECT 1
            FROM users
            WHERE email = $1 AND password = crypt($2::TEXT, password)
        ) AS authenticated
    `, [email, password])).rows[0];
    res.send(authenticated);
  },
};

