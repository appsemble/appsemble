const { readdirSync } = require('node:fs');

const { CI, CI_COMMIT_TAG, CI_MERGE_REQUEST_IID } = process.env;
const domain = CI_COMMIT_TAG
  ? 'appsemble.app'
  : `${CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;

module.exports = {
  ci: {
    collect: {
      settings: {
        chromeFlags: ['--headless', CI && '--no-sandbox'].filter(Boolean).join(' '),
      },
      url: readdirSync('apps').map((path) => `https://${path}.appsemble.${domain}`),
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.7 }],
        'categories:best-practices': ['error', { minScore: 0.7 }],
        // This check is too unstable, as its variable and sometimes even produces NaN results.
        // 'categories:performance': ['error', { minScore: 0.5 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
  },
};
