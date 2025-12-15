import { describe, expect, it } from 'vitest';

import { decrypt, encrypt } from './crypto.js';

describe('crypto', () => {
  it('should be able to encrypt and decrypt a string and return the same result', () => {
    const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const input = 'Super secret message';
    const encrypted = encrypt(input, key);
    const decrypted = decrypt(encrypted, key);

    expect(decrypted).toStrictEqual(input);
  });

  it('should not return the same buffer using the same input', () => {
    const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const input = 'Super secret message';

    const a = encrypt(input, key);
    const b = encrypt(input, key);

    expect(a).not.toStrictEqual(b);
  });

  it('should not work with different keys', () => {
    const keyA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    const keyB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567891';
    const input = 'Super secret message';
    const encrypted = encrypt(input, keyA);
    expect(() => decrypt(encrypted, keyB)).toThrowError(
      'Unsupported state or unable to authenticate data',
    );
  });
});
