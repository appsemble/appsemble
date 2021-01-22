import { request, setTestApp } from 'axios-test-instance';

import { App, AppMessages, Member, Organization, User } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let app: App;
let user: User;

beforeAll(createTestSchema('messages'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  ({ authorization, user } = await testToken());
  const organization = await Organization.create({
    id: 'testorganization',
    name: 'Test Organization',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'AppEditor' });
  app = await App.create({
    path: 'test-app',
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: 'testorganization',
    definition: {
      name: 'Test App',
      description: 'Description',
      pages: [],
    },
  });
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getMessages', () => {
  it('should return the messages for an existing language', async () => {
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en-gb',
        messages: { test: 'Test.' },
      },
      { headers: { authorization } },
    );

    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(data).toMatchObject({ language: 'en-gb', messages: { test: 'Test.' } });
  });

  it('should return a 404 if a language is not supported', async () => {
    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(data).toMatchObject({ statusCode: 404, message: 'Language “en-GB” could not be found' });
  });

  it('should return a 200 if a language is not supported, but is the default language', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl-nl',
      },
    });
    const response = await request.get(`/api/apps/${app.id}/messages/nl-nl`);
    expect(response).toMatchObject({ status: 200, data: { language: 'nl-nl', messages: {} } });
  });

  it('should return a 200 if a en-us is not supported and is default language unset', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en-us`);
    expect(response).toMatchObject({ status: 200, data: { language: 'en-us', messages: {} } });
  });

  it('should merge messages with the base language if merge is enabled', async () => {
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en',
        messages: { test: 'Test.', bla: 'bla' },
      },
      { headers: { authorization } },
    );

    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en-gb',
        messages: { bla: 'blah' },
      },
      { headers: { authorization } },
    );

    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB?merge=true`);

    expect(data).toMatchObject({ language: 'en-gb', messages: { test: 'Test.', bla: 'blah' } });
  });
});

describe('createMessages', () => {
  it('should accept valid requests', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en',
        messages: { test: 'Test.' },
      },
      { headers: { authorization } },
    );
    const translation = await AppMessages.findOne({ where: { AppId: app.id, language: 'en' } });

    expect(response).toMatchObject({
      status: 201,
      data: { language: 'en', messages: { test: 'Test.' } },
    });
    expect(translation.messages).toStrictEqual({ test: 'Test.' });
  });

  it('should not accept invalid language tags', async () => {
    const response = await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'english',
        messages: { test: 'Test.' },
      },
      { headers: { authorization } },
    );

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Language “english” is invalid' },
    });
  });
});

describe('deleteMessages', () => {
  it('should delete existing messages', async () => {
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en',
        messages: { test: 'Test.' },
      },
      { headers: { authorization } },
    );

    const response = await request.delete(`/api/apps/${app.id}/messages/en`, {
      headers: { authorization },
    });

    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existant messages', async () => {
    const response = await request.delete(`/api/apps/${app.id}/messages/en`, {
      headers: { authorization },
    });

    expect(response).toMatchObject({
      data: { statusCode: 404, message: 'App does not have messages for “en”' },
    });
  });
});

describe('getLanguages', () => {
  it('should return a the default app language if no translations are available', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl-nl',
      },
    });
    const { data } = await request.get(`/api/apps/${app.id}/messages`);
    expect(data).toStrictEqual(['nl-nl']);
  });

  it('should fallback to the default value of defaultLanguage', async () => {
    const { data } = await request.get(`/api/apps/${app.id}/messages`);
    expect(data).toStrictEqual(['en-us']);
  });

  it('should return a list of available languages', async () => {
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'nl',
        messages: { test: 'Geslaagd met vliegende kleuren' },
      },
      { headers: { authorization } },
    );
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en',
        messages: { test: 'Passed with flying colors' },
      },
      { headers: { authorization } },
    );
    await request.post(
      `/api/apps/${app.id}/messages`,
      {
        language: 'en-GB',
        messages: { test: 'Passed with flying colours' },
      },
      { headers: { authorization } },
    );

    const { data } = await request.get(`/api/apps/${app.id}/messages`, {
      headers: { authorization },
    });

    expect(data).toStrictEqual(['en', 'en-gb', 'en-us', 'nl']);
  });
});
