import { zxcvbnOptions } from '@zxcvbn-ts/core';

import { messages } from './messages';

describe('messages', () => {
  it('should match core messages', () => {
    const zxcvbnMessages = [
      ...new Set([
        ...Object.keys(zxcvbnOptions.translations.suggestions),
        ...Object.keys(zxcvbnOptions.translations.warnings),
      ]),
      'minLength',
      'required',
    ].sort();
    expect(Object.keys(messages).sort()).toStrictEqual(zxcvbnMessages);
  });
});
