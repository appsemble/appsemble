import { ZxcvbnOptions } from '@zxcvbn-ts/core';

import { messages } from './messages';

describe('messages', () => {
  it('should match core messages', () => {
    const zxcvbnMessages = [
      ...new Set([
        ...Object.keys(ZxcvbnOptions.translations.suggestions),
        ...Object.keys(ZxcvbnOptions.translations.warnings),
      ]),
      'minLength',
      'required',
    ].sort();
    expect(Object.keys(messages).sort()).toStrictEqual(zxcvbnMessages);
  });
});
