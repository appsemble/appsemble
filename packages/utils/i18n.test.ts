import { describe, expect, it } from 'vitest';

import { detectLocale, sortLocales } from './i18n.js';

describe('sortLocales', () => {
  const tests: [string[], string[]][] = [
    [
      // The user prefers any form of English.
      ['en'],
      ['en'],
    ],
    [
      // The user prefers international English, but is willing to accept any other form of English.
      ['en-US', 'en'],
      ['en-us', 'en'],
    ],
    [
      // The user accepts English, preferably international English.
      ['en', 'en-US'],
      ['en-us', 'en'],
    ],
    [
      // The user accepts any for of English, preferably international English, or British over
      // alternative forms.
      ['en', 'en-US', 'en-GB'],
      ['en-us', 'en-gb', 'en'],
    ],
    [
      // The accepts English, or Dutch.
      ['en', 'nl'],
      ['en', 'nl'],
    ],
    [
      // The accepts English, or Dutch (Netherlands).
      ['en', 'nl-NL'],
      ['en', 'nl-nl'],
    ],
    [
      // XXX because Britsh is a subtag of English, it should be preferred over Dutch
      ['en', 'en-US', 'nl', 'nl-NL', 'nl-BE', 'en-GB'],
      ['en-us', 'en', 'nl-nl', 'nl-be', 'nl', 'en-gb'],
    ],
    [
      // More specific languages of the same subtag should be sorted first.
      ['zh', 'zh-Hant', 'zh-Hant-HK'],
      ['zh-hant-hk', 'zh-hant', 'zh'],
    ],
    [
      // XXX because international English is a subtag of English, it should be preferred over
      // Chinese.
      ['en', 'zh', 'zh-Hant', 'zh-Hant-HK', 'en-US'],
      ['en', 'zh-hant-hk', 'zh-hant', 'zh', 'en-us'],
    ],
    [
      // Locales that share the same starting characters should be treated differently.
      ['cu', 'custom', 'custom-locale', 'cu'],
      ['cu', 'custom-locale', 'custom', 'cu'],
    ],
  ];

  it.each(tests)('should sort %p as %p', (languages, expected) => {
    const result = sortLocales(languages);

    expect(result).toStrictEqual(expected);
  });
});

describe('detectLocale', () => {
  const tests: [string[], string[], string][] = [
    [['en'], ['en'], 'en'],
    [['en', 'en-US'], ['en', 'en-US'], 'en-us'],
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    [['nl'], ['en', 'en-US'], undefined],

    // XXX The following need to be handled by the sorting algorithm in `sortLocales()`,
    [['en', 'nl', 'en-US'], ['en', 'nl', 'en-US'], 'en'],
  ];

  it.each(tests)('%p %p %p', (languages, choices, expected) => {
    const result = detectLocale(languages, choices);

    expect(result).toBe(expected);
  });
});
