/**
 * GET /
 * @param {express.Request} req the request sent from the client
 * @param {express.Response} res the response sent back to the client
 */
exports.get = function(req, res) {
  res.render('index', {
    tree: req.query.tree,
  });
};
