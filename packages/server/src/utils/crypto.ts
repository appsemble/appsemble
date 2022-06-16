import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 *
 * @param input - The input string to encrypt.
 * @param key - The key used in the encryption algorithm.
 * @returns The encrypted data.
 */
export function encrypt(input: string, key: string): Buffer {
  const keyHash = createHash('sha256').update(key).digest();
  const iv = randomBytes(IV_LENGTH);
  const message = Buffer.from(input, 'utf8');

  const cipher = createCipheriv(ALGO, keyHash, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encryptedData = Buffer.concat([
    cipher.update(message),
    cipher.final(),
    iv,
    cipher.getAuthTag(),
  ]);

  return encryptedData;
}

/**
 * Decrypts a previously encrypted string using AES-256 GCM.
 *
 * @param input - The encrypted data.
 * @param key - The key that was used to encrypt the data.
 * @returns The decrypted string.
 */
export function decrypt(input: Buffer, key: string): string {
  const keyHash = createHash('sha256').update(key).digest();
  const encryptedData = input.slice(0, input.length - IV_LENGTH - AUTH_TAG_LENGTH);
  const iv = input.slice(
    input.length - IV_LENGTH - AUTH_TAG_LENGTH,
    input.length - AUTH_TAG_LENGTH,
  );
  const authTag = input.slice(input.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGO, keyHash, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return String(decryptedData);
}
