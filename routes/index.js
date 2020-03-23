/**
 * Route handler for /.
 * 
 * @param req the Express request
 * @param res the Express response
 */
exports.get = function(req, res) {
  res.render("index", {
    tree: req.query.tree,
  });
}
