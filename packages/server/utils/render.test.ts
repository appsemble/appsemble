import { type ContentSecurityPolicy, makeCSP } from '@appsemble/node-utils';
import { describe, expect, it } from 'vitest';

describe('makeCSP', () => {
  const fixtures: Record<string, ContentSecurityPolicy> = {
    "script-src 'self'": {
      'script-src': ["'self'"],
    },
    'script-src connect.facebook.net': {
      'script-src': ['connect.facebook.net'],
    },
    '': {
      'script-src': [false],
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
