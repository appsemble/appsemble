const { readFileSync } = require('fs');
const { join } = require('path');

const dictionary = require('dictionary-en');
const english = require('retext-english');
const quotes = require('retext-quotes');
const repeatedWords = require('retext-repeated-words');
const spell = require('retext-spell');
const syntaxURLs = require('retext-syntax-urls');
const usage = require('retext-usage');
const unified = require('unified');

module.exports = {
  plugins: [
    'remark-frontmatter',
    ['remark-validate-links', { repository: 'https://gitlab.com/appsemble/appsemble.git' }],
    [
      'remark-retext',
      unified()
        .use(english)
        .use(syntaxURLs)
        .use(spell, {
          dictionary,
          personal: readFileSync(join(__dirname, 'config/retext/personal.dic')),
        })
        .use(repeatedWords)
        .use(quotes)
        .use(usage),
    ],
  ],
};
