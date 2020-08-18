try {
  // eslint-disable-next-line import/no-unresolved, node/global-require
  module.exports = require('./dist');
} catch {
  // eslint-disable-next-line node/global-require
  module.exports = require('./src');
}
