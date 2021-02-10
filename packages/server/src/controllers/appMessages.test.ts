import { request, setTestApp } from 'axios-test-instance';

import { App, AppMessages, Member, Organization } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeStudio, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

let app: App;

beforeAll(createTestSchema('messages'));

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  const user = await createTestUser();
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
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { test: 'Test.' },
    });

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

  it('should return a 200 if a en is not supported and is default language unset', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchObject({ status: 200, data: { language: 'en', messages: {} } });
  });

  it('should merge messages with the base language if merge is enabled', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { test: 'Test.', bla: 'bla' },
    });

    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { bla: 'blah' },
    });

    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB?merge=true`);

    expect(data).toMatchObject({ language: 'en-gb', messages: { test: 'Test.', bla: 'blah' } });
  });
});

describe('createMessages', () => {
  it('should accept valid requests', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { test: 'Test.' },
    });
    const translation = await AppMessages.findOne({ where: { AppId: app.id, language: 'en' } });

    expect(response).toMatchObject({
      status: 201,
      data: { language: 'en', messages: { test: 'Test.' } },
    });
    expect(translation.messages).toStrictEqual({ test: 'Test.' });
  });

  it('should not accept invalid language tags', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'english',
      messages: { test: 'Test.' },
    });

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Language “english” is invalid' },
    });
  });
});

describe('deleteMessages', () => {
  it('should delete existing messages', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { test: 'Test.' },
    });

    const response = await request.delete(`/api/apps/${app.id}/messages/en`);

    expect(response.status).toBe(204);
  });

  it('should return 404 when deleting non-existant messages', async () => {
    authorizeStudio();
    const response = await request.delete(`/api/apps/${app.id}/messages/en`);

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
    expect(data).toStrictEqual(['en']);
  });

  it('should return a list of available languages', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'nl',
      messages: { test: 'Geslaagd met vliegende kleuren' },
    });
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { test: 'Passed with flying colors' },
    });
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-GB',
      messages: { test: 'Passed with flying colours' },
    });

    const { data } = await request.get(`/api/apps/${app.id}/messages`);

    expect(data).toStrictEqual(['en', 'en-gb', 'nl']);
  });
});
