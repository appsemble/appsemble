try {
  // eslint-disable-next-line global-require, import/no-unresolved
  module.exports = require('./dist');
} catch (error) {
  // eslint-disable-next-line global-require
  module.exports = require('./src');
}
