const { readFileSync } = require('fs');
const { join } = require('path');

const dictionary = require('dictionary-en');
const retextEnglish = require('retext-english');
const retextQuotes = require('retext-quotes');
const retextRepeatedWords = require('retext-repeated-words');
const retextSpell = require('retext-spell');
const retextSyntaxURLs = require('retext-syntax-urls');
const unified = require('unified');

module.exports = {
  plugins: [
    'remark-frontmatter',
    'remark-gfm',
    'remark-lint-heading-increment',
    'remark-lint-no-duplicate-defined-urls',
    'remark-lint-no-duplicate-definitions',
    'remark-lint-no-empty-url',
    'remark-lint-no-reference-like-url',
    'remark-lint-no-undefined-references',
    'remark-lint-no-unneeded-full-reference-image',
    'remark-lint-no-unneeded-full-reference-link',
    'remark-lint-no-unused-definitions',
    'remark-prettier',
    ['remark-validate-links', { repository: 'https://gitlab.com/appsemble/appsemble.git' }],
    [
      'remark-retext',
      unified()
        .use(retextEnglish)
        .use(retextSyntaxURLs)
        .use(retextSpell, {
          dictionary,
          personal: readFileSync(join(__dirname, 'config/retext/personal.dic')),
        })
        .use(retextRepeatedWords)
        .use(retextQuotes),
    ],
  ],
};
