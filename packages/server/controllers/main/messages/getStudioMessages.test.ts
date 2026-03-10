import { request, setTestApp } from 'axios-test-instance';
import { beforeAll, describe, expect, it } from 'vitest';

import { setArgv } from '../../../index.js';
import { type AppMessages } from '../../../models/index.js';
import { createServer } from '../../../utils/createServer.js';

describe('getStudioMessages', () => {
  beforeAll(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    await setTestApp(server);
  });

  it('should return all translations for a language', async () => {
    const result = await request.get<AppMessages>('/api/messages/nl');
    const keys = Object.keys(result.data.messages ?? {});
    expect(result).toMatchObject({ status: 200, data: { language: 'nl' } });
    expect(
      keys.every((key) => key.startsWith('studio') || key.startsWith('react-components')),
    ).toBe(true);
  });

  it('should filter based on the context given', async () => {
    const resultStudio = await request.get<AppMessages>('/api/messages/nl');
    expect(
      Object.keys(resultStudio.data.messages ?? {}).every(
        (key) => key.startsWith('studio') || key.startsWith('react-components'),
      ),
    ).toBe(true);
  });

  it('should return empty messages if requesting the default language', async () => {
    const result = await request('/api/messages/en');
    expect(result).toMatchObject({ status: 200, data: { language: 'en', messages: {} } });
  });

  it('should return 404 on languages that aren’t supported', async () => {
    const result = await request('/api/messages/kv-ru');
    expect(result).toMatchObject({
      status: 404,
      data: { message: 'Language “kv-ru” could not be found' },
    });
  });

  it('should return 400 on misformatted languages', async () => {
    const result = await request('/api/messages/invalid');
    expect(result).toMatchObject({
      status: 400,
      data: { message: 'Language code “invalid” is invalid' },
    });
  });
});
