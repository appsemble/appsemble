import { createFixtureStream } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';

import {
  App,
  AppMessages,
  BlockMessages,
  BlockVersion,
  Member,
  Organization,
  User,
} from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { getAppsembleMessages } from '../utils/getAppsembleMessages';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../utils/test/authorization';
import { useTestDatabase } from '../utils/test/testSchema';

let app: App;
let user: User;

useTestDatabase('messages');

beforeAll(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  await setTestApp(server);
});

beforeEach(async () => {
  user = await createTestUser();
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

describe('getMessages', () => {
  it('should return the messages for an existing language', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { messageIds: { test: 'Test.' } },
    });

    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(data).toMatchObject({
      language: 'en-gb',
      messages: {
        core: {},
        blocks: {},
        app: { name: 'Test App', description: 'Description' },
        messageIds: { test: 'Test.' },
      },
    });
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
      messages: { messageIds: { test: 'Test.', bla: 'bla' } },
    });

    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { messageIds: { bla: 'blah' } },
    });

    const { data } = await request.get(`/api/apps/${app.id}/messages/en-GB?merge=true`);

    expect(data).toMatchObject({
      language: 'en-gb',
      messages: { messageIds: { test: 'Test.', bla: 'blah' } },
    });
  });

  it('should include translated block messages', async () => {
    authorizeStudio();
    await Organization.create({
      id: 'appsemble',
      name: 'Appsemble',
    });
    const blockA = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    const blockB = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.1',
    });
    const blockC = await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'form',
      version: '0.0.0',
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en',
      messages: { foo: 'bar', bla: 'bla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockB.id,
      language: 'en',
      messages: { foo: 'bar', test: 'test', bla: 'blablabla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockC.id,
      language: 'en',
      messages: { form: 'form' },
    });
    await app.update({
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [
          {
            name: 'test',
            blocks: [
              { type: '@testorganization/test', version: '0.0.0' },
              { type: '@testorganization/test', version: '0.0.1' },
              { type: 'form', version: '0.0.0' },
            ],
          },
        ],
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en',
        messages: {
          app: {},
          core: {},
          blocks: {
            '@appsemble/form': { '0.0.0': { form: 'form' } },
            '@testorganization/test': {
              '0.0.0': { foo: 'bar', bla: 'bla' },
              '0.0.1': { foo: 'bar', test: 'test', bla: 'blablabla' },
            },
          },
        },
      },
    });
  });

  it('should merge translations if other language’s translations are incomplete', async () => {
    authorizeStudio();
    const blockA = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en',
      messages: { foo: 'bar', bla: 'bla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'nl',
      messages: { foo: 'foo but dutch', bla: '' },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: { messageIds: { test: 'test translation' } },
    });
    await app.update({
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [
          {
            name: 'test',
            blocks: [{ type: '@testorganization/test', version: '0.0.0' }],
          },
        ],
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/nl`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'nl',
        messages: {
          messageIds: { test: 'test translation' },
          core: {},
          blocks: {
            '@testorganization/test': {
              '0.0.0': { foo: 'foo but dutch', bla: 'bla' },
            },
          },
        },
      },
    });
  });

  it('should merge block translations with the base language', async () => {
    authorizeStudio();
    const blockA = await BlockVersion.create({
      OrganizationId: 'testorganization',
      name: 'test',
      version: '0.0.0',
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en',
      messages: { foo: 'bar', bla: 'bla' },
    });
    await BlockMessages.create({
      BlockVersionId: blockA.id,
      language: 'en-gb',
      messages: { foo: '', bla: 'blah' },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'en-gb',
      messages: { messageIds: { test: 'test translation' } },
    });
    await app.update({
      definition: {
        name: 'Test App',
        description: 'Description',
        pages: [
          {
            name: 'test',
            blocks: [{ type: '@testorganization/test', version: '0.0.0' }],
          },
        ],
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en-gb`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en-gb',
        messages: {
          messageIds: { test: 'test translation' },
          blocks: {
            '@testorganization/test': {
              '0.0.0': { foo: 'bar', bla: 'blah' },
            },
          },
        },
      },
    });
  });

  it('should include dutch core translations', async () => {
    authorizeStudio();
    const messages = await getAppsembleMessages('nl');
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: { messageIds: { test: 'test translation' } },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/nl`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'nl',
        messages: {
          messageIds: { test: 'test translation' },
          core: {
            ...Object.fromEntries(
              Object.entries(messages).filter(
                ([key]) => key.startsWith('app') || key.startsWith('react-components'),
              ),
            ),
          },
          blocks: {},
        },
      },
    });
  });

  it('should include defaults for app messages if override is set to false', async () => {
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        en: { test: 'foo' },
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);
    await BlockVersion.findOne({
      where: { version: '1.32.9', OrganizationId: 'xkcd', name: 'standing' },
      include: [BlockMessages],
    });
    await app.update({
      definition: {
        ...app.definition,
        pages: [
          { name: 'test-page', blocks: [{ type: '@xkcd/standing', version: '1.32.9' }] },
          { name: 'test-page-2', blocks: [{ type: '@xkcd/standing', version: '1.32.9' }] },
        ],
      },
    });

    authorizeStudio();
    const messages = await getAppsembleMessages('en');
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: {
        messageIds: { bla: 'bla' },
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en?override=false`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en',
        messages: {
          messageIds: {},
          core: {
            ...Object.fromEntries(
              Object.entries(messages).filter(
                ([key]) => key.startsWith('app') || key.startsWith('react-components'),
              ),
            ),
          },
          app: {
            name: 'Test App',
            description: 'Description',
            'pages.0': 'test-page',
            'pages.1': 'test-page-2',
            'pages.0.blocks.0.test': 'foo',
            'pages.1.blocks.0.test': 'foo',
          },
          blocks: {
            '@xkcd/standing': {
              '1.32.9': {
                test: 'foo',
              },
            },
          },
        },
      },
    });
  });

  it('should only include overwritten app messages if override is not set to false', async () => {
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });
    formData.append(
      'messages',
      JSON.stringify({
        en: { test: 'foo' },
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);
    await BlockVersion.findOne({
      where: { version: '1.32.9', OrganizationId: 'xkcd', name: 'standing' },
      include: [BlockMessages],
    });
    await app.update({
      definition: {
        ...app.definition,
        pages: [
          { name: 'test-page', blocks: [{ type: '@xkcd/standing', version: '1.32.9' }] },
          { name: 'test-page-2', blocks: [{ type: '@xkcd/standing', version: '1.32.9' }] },
        ],
      },
    });

    authorizeStudio();
    const messages = await getAppsembleMessages('en');
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: {
        app: { 'pages.0.blocks.0.test': 'Bla' },

        messageIds: { bla: 'bla' },
      },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en',
        messages: {
          messageIds: { bla: 'bla' },
          core: {
            ...Object.fromEntries(
              Object.entries(messages).filter(
                ([key]) => key.startsWith('app') || key.startsWith('react-components'),
              ),
            ),
          },
          app: {
            name: 'Test App',
            description: 'Description',
            'pages.0': 'test-page',
            'pages.1': 'test-page-2',
            'pages.0.blocks.0.test': 'Bla',
          },
          blocks: {
            '@xkcd/standing': {
              '1.32.9': {
                test: 'foo',
              },
            },
          },
        },
      },
    });
  });
});

describe('createMessages', () => {
  it('should accept valid requests', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { messageIds: { test: 'Test.' } },
    });
    const translation = await AppMessages.findOne({ where: { AppId: app.id, language: 'en' } });

    expect(response).toMatchObject({
      status: 201,
      data: { language: 'en', messages: { messageIds: { test: 'Test.' } } },
    });
    expect(translation.messages).toStrictEqual({ messageIds: { test: 'Test.' } });
  });

  it('should not accept invalid language tags', async () => {
    authorizeStudio();
    const response = await request.post(`/api/apps/${app.id}/messages`, {
      language: 'english',
      messages: { messageIds: { test: 'Test.' } },
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
      messages: { messageIds: { test: 'Test.' } },
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
      messages: { messageIds: { test: 'Geslaagd met vliegende kleuren' } },
    });
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en',
      messages: { messageIds: { test: 'Passed with flying colors' } },
    });
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-GB',
      messages: { messageIds: { test: 'Passed with flying colours' } },
    });

    const { data } = await request.get(`/api/apps/${app.id}/messages`);

    expect(data).toStrictEqual(['en', 'en-gb', 'nl']);
  });
});
