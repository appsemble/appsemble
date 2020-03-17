// eslint-disable-next-line import/no-dynamic-require
module.exports = require(process.env.NODE_ENV === 'production' ? './dist' : './src');
