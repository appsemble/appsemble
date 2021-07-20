const config = require('../../config/jest/config')(__dirname);

module.exports = {
  ...config,
  testRegex: '(/__tests__/.*|(\\.|/)test)\\.ts$',
};
