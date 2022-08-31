import { readFile } from 'fs/promises';

import dictionary from 'dictionary-en';
import retextEnglish from 'retext-english';
import retextQuotes from 'retext-quotes';
import retextRepeatedWords from 'retext-repeated-words';
import retextSpell from 'retext-spell';
import retextSyntaxURLs from 'retext-syntax-urls';
import { unified } from 'unified';

export default {
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
          personal: await readFile(new URL('config/retext/personal.dic', import.meta.url)),
        })
        .use(retextRepeatedWords)
        .use(retextQuotes),
    ],
  ],
};
