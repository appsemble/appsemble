const dictionary = require('dictionary-en-us');
const fs = require('fs');
const path = require('path');
const english = require('retext-english');
const quotes = require('retext-quotes');
const repeatedWords = require('retext-repeated-words');
const spell = require('retext-spell');
const syntaxURLs = require('retext-syntax-urls');
const usage = require('retext-usage');
const unified = require('unified');

exports.plugins = {
  'remark-retext': unified()
    .use(english)
    .use(syntaxURLs)
    .use(spell, {
      dictionary,
      personal: fs.readFileSync(path.join(__dirname, 'config/retext/personal.dic')),
    })
    .use(repeatedWords)
    .use(quotes)
    .use(usage),
};
