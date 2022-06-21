import { ContentSecurityPolicy, makeCSP } from './render';

describe('makeCSP', () => {
  const fixtures: Record<string, ContentSecurityPolicy> = {
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

  for (const [expected, input] of Object.entries(fixtures)) {
    it(`should be able to process “${expected}”`, () => {
      const csp = makeCSP(input);
      expect(csp).toBe(expected);
    });
  }
});
