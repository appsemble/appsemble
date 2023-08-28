// Ts-node doesn’t understand this if it’s written as TypeScript.
module.exports.faVersion = require('@fortawesome/fontawesome-free/package.json').version;
module.exports.bulmaVersion = require('bulma/package.json').version;
module.exports.version = require('./package.json').version;
