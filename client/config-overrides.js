const webpack = require('webpack');
module.exports = function override(config, env) {
  config.resolve.fallback = {
    stream: require.resolve('stream-browserify'),
  };

  return config;
}
