import { request, setTestApp } from 'axios-test-instance';

import { setArgv } from '..';
import { createServer } from '../utils/createServer';

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

describe('getAppsembleLanguages', () => {
  it('should return the list of languages appsemble supports', async () => {
    const result = await request('/api/messages');
    expect(result).toMatchObject({ status: 200, data: expect.arrayContaining(['en', 'nl']) });
  });
});

describe('getStudioMessages', () => {
  it('should return all translations for a language', async () => {
    const result = await request('/api/messages/nl');
    const keys = Object.keys(result.data.messages);
    expect(result).toMatchObject({ status: 200, data: { language: 'nl' } });
    expect(keys.some((key) => key.startsWith('app'))).toStrictEqual(true);
    expect(keys.some((key) => key.startsWith('studio'))).toStrictEqual(true);
    expect(keys.some((key) => key.startsWith('react-components'))).toStrictEqual(true);
  });

  it('should filter based on the context given', async () => {
    const resultStudio = await request('/api/messages/nl?context=studio');
    const resultApp = await request('/api/messages/nl?context=app');

    const keysStudio = Object.keys(resultStudio.data.messages);
    const keysApp = Object.keys(resultApp.data.messages);

    expect(
      keysStudio.every((key) => key.startsWith('studio') || key.startsWith('react-components')),
    ).toStrictEqual(true);
    expect(
      keysApp.every((key) => key.startsWith('app') || key.startsWith('react-components')),
    ).toStrictEqual(true);
  });

  it('should return empty messages if requesting the default language', async () => {
    const result = await request('/api/messages/en');
    expect(result).toMatchObject({ status: 200, data: { language: 'en', messages: {} } });
  });

  it('should return 404 on languages that aren’t supported', async () => {
    const result = await request('/api/messages/ko-kr');
    expect(result).toMatchObject({
      status: 404,
      data: { message: 'Language “ko-kr” could not be found' },
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
