const dictionary = require('dictionary-en-us');
const fs = require('fs');
const path = require('path');
const frontmatter = require('remark-frontmatter');
const english = require('retext-english');
const repeatedWords = require('retext-repeated-words');
const retext = require('remark-retext');
const spell = require('retext-spell');
const syntaxURLs = require('retext-syntax-urls');
const usage = require('retext-usage');
const unified = require('unified');

exports.plugins = [
  frontmatter,
  [
    retext,
    unified().use({
      plugins: [
        english,
        syntaxURLs,
        [
          spell,
          {
            dictionary,
            personal: fs.readFileSync(path.join(__dirname, 'config/retext/personal.dic')),
          },
        ],
        repeatedWords,
        usage,
      ],
    }),
  ],
];
