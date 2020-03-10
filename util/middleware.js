/**
 * Injects global constants into the local scope of the Pug renderer.
 */
exports.injectGlobalLocals = function(req, res, next) {
  res.locals.assets = {
    vue: process.env.NODE_ENV === "development" ?
        "https://cdn.jsdelivr.net/npm/vue/dist/vue.js" :
        "https://cdn.jsdelivr.net/npm/vue@2.6.11",
  };
  next();
}
