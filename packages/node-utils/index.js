try {
  // eslint-disable-next-line global-require
  module.exports = require('./dist');
} catch (error) {
  // eslint-disable-next-line global-require
  module.exports = require('./src');
}
