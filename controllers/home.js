/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  res.render('home', {
    title: 'Home',
    env: process.env.FOXALL_ENV
  });
};