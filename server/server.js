// jsonbrowser plugin, server-side component
// These handlers are launched with the wiki server.

(function() {
  const startServer = params => {
    var app = params.app,
        argv = params.argv;

    return app.get('/plugin/jsonbrowser/:thing', (req, res) => {
      var thing = req.params.thing;
      return res.json({thing});
    });
  };

  module.exports = {startServer};

}).call(this);
