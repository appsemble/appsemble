const { chromium } = require('@playwright/test');

module.exports = {
  ci: {
    collect: {
      chromePath: chromium.executablePath(),
      settings: {
        chromeFlags: '--headless --no-sandbox --ignore-certificate-errors',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.7 }],
        'categories:best-practices': ['error', { minScore: 0.7 }],
        // This check is too unstable, as its variable and sometimes even produces NaN results.
        // 'categories:performance': ['error', { minScore: 0.5 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
  },
};
