const db = require('../util/db');

exports.users = {
  /**
   * GET /admin/users
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async get(req, res) {
    res.render('admin/users', {
      users: (await db.pool.query('SELECT * FROM users')).rows,
    });
  },

  /**
   * POST /admin/users/update
   * @param {express.Request} req the request sent from the client
   * @param {express.Response} res the response sent back to the client
   */
  async update(req, res) {
    const {email, instructor} = req.body;

    // `email` field is required
    if (!email) {
      res.status(400).end();
      return;
    }

    await db.pool.query(
        'UPDATE users SET instructor = $1 WHERE email = $2',
        [instructor, email],
    );
    res.end();
  },
};
