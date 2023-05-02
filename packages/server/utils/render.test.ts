import { makeCSP } from '@appsemble/node-utils';
import { ContentSecurityPolicy } from '@appsemble/node-utils/server/types';

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

  it.each(Object.entries(fixtures))('should be able to process “%s”', (expected, input) => {
    const csp = makeCSP(input);
    expect(csp).toBe(expected);
  });
});
