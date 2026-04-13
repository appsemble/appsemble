import { fileURLToPath } from 'node:url';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const readdir = vi.fn();
const readFile = vi.fn();

vi.mock('node:fs/promises', () => ({
  readdir,
  readFile,
}));

let getAppsembleMessages: typeof import('./getAppsembleMessages.js').getAppsembleMessages;
let getSupportedLanguages: typeof import('./getAppsembleMessages.js').getSupportedLanguages;
let translationsDir: string;

describe('getAppsembleMessages', () => {
  beforeAll(async () => {
    ({ getAppsembleMessages, getSupportedLanguages } = await import('./getAppsembleMessages.js'));
    translationsDir = fileURLToPath(new URL('../../i18n/', import.meta.url));
  });

  beforeEach(() => {
    readdir.mockResolvedValue(['en.json', 'pt_BR.json', 'zh_Hans.json']);
    readFile.mockImplementation((url: URL | string) => {
      const path = typeof url === 'string' ? url : fileURLToPath(url);
      switch (path) {
        case `${translationsDir}en.json`:
          return '{"hello":"Hello"}';
        case `${translationsDir}pt_BR.json`:
          return '{"hello":"Olá"}';
        case `${translationsDir}zh_Hans.json`:
          return '{"hello":"你好"}';
        default:
          throw new Error(`Unexpected file read: ${path}`);
      }
    });
  });

  it('should normalize supported languages from filenames', async () => {
    expect(await getSupportedLanguages()).toStrictEqual(new Set(['en', 'pt-br', 'zh-hans']));
  });

  it('should read normalized language requests from underscored filenames', async () => {
    expect(await getAppsembleMessages('pt-br')).toStrictEqual({ hello: 'Olá' });
  });

  it('should merge base language messages from underscored filenames', async () => {
    expect(await getAppsembleMessages('zh-hans', 'en')).toStrictEqual({ hello: '你好' });
  });
});
