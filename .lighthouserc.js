const fs = require('fs');

const puppeteer = require('puppeteer');

module.exports = {
  ci: {
    collect: {
      chromePath: puppeteer.executablePath(),
      settings: {
        chromeFlags: ['--headless', 'CI' in process.env && '--no-sandbox']
          .filter(Boolean)
          .join(' '),
      },
      url: fs
        .readdirSync('apps')
        .map((path) => `https://${path}.appsemble.staging.appsemble.review`),
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
