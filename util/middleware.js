const cp = require("child_process");

/**
 * Injects global constants into the local scope of the Pug renderer.
 */
exports.injectGlobalLocals = function(req, res, next) {
  // set the current git commit hash
  res.locals.commit = cp.execSync("git rev-parse HEAD").toString().trim();

  // set the URL of the Vue.js CDN
  res.locals.assets = {
    vue: process.env.NODE_ENV === "development" ?
        "https://cdn.jsdelivr.net/npm/vue/dist/vue.js" :
        "https://cdn.jsdelivr.net/npm/vue@2.6.11",
  };
  next();
}
