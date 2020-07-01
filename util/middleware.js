const cp = require("child_process");

/**
 * Injects global constants into the local scope of the Pug templating engine.
 */
exports.injectLocals = function(req, res, next) {
  // Inject the hash string for the latest commit
  res.locals.commit = cp.execSync("git rev-parse HEAD").toString().trim();

  // Inject the URLs for libraries
  res.locals.assets = {
    // The URL for Vue.js changes based on the environment
    vue: process.env.NODE_ENV === "development" ?
        "https://cdn.jsdelivr.net/npm/vue/dist/vue.js" :
        "https://cdn.jsdelivr.net/npm/vue@2.6.11",
  };
  next();
}
