const { readdirSync } = require('fs');

const puppeteer = require('puppeteer');

const { CI, CI_COMMIT_TAG, CI_MERGE_REQUEST_ID } = process.env;
const domain = CI_COMMIT_TAG
  ? 'appsemble.app'
  : `${CI_MERGE_REQUEST_ID || 'staging'}.appsemble.review`;

module.exports = {
  ci: {
    collect: {
      chromePath: puppeteer.executablePath(),
      settings: {
        chromeFlags: ['--headless', CI && '--no-sandbox'].filter(Boolean).join(' '),
      },
      url: readdirSync('apps').map((path) => `https://${path}.appsemble.${domain}`),
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.7 }],
        'categories:performance': ['error', { minScore: 0.5 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
  },
};
