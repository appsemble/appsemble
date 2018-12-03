import makeCSP from './makeCSP';

describe('makeCSP', () => {
  const fixtures = {
    "script-src 'self'": {
      'script-src': ["'self'"],
    },
    'script-src connect.facebook.net': {
      'script-src': ['connect.facebook.net'],
    },
    '': {
      'script-src': [null],
    },
    "script-src 'none' 'self' https://example.com": {
      'script-src': ["'none'", "'self'", 'https://example.com'],
    },
    "script-src 'self'; style-src 'unsafe-inline'": {
      'style-src': ["'unsafe-inline'"],
      'script-src': ["'self'"],
    },
  };

  Object.entries(fixtures).forEach(([expected, input]) => {
    it(`should be able to process “${expected}”`, () => {
      const csp = makeCSP(input);
      expect(csp).toBe(expected);
    });
  });
});
