import { createFixtureStream, getAppsembleMessages } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  App,
  AppMessages,
  BlockMessages,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  authorizeStudio,
  createTestUser,
} from '../../../../utils/test/authorization.js';

let app: App;
let user: User;

describe('getAppMessages', () => {
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Owner',
    });
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

  it('should return the messages for an existing language', async () => {
    authorizeStudio();
    await request.post(`/api/apps/${app.id}/messages`, {
      language: 'en-gb',
      messages: { messageIds: { test: 'Test.' } },
    });

    const response = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en-gb",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {
            "test": "Test.",
          },
        },
      }
    `,
    );
  });

  it('should return block messages only for the blocks used in the app', async () => {
    await AppMessages.create({
      AppId: app.id,
      messages: {
        messageIds: {
          hello: 'world',
        },
        blocks: {
          '@testorganization/test': {
            '0.0.0': 'Foo',
          },
        },
        app: {
          name: 'App Name',
        },
      },
      language: 'en',
    });
    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en',
        messages: {
          messageIds: {
            hello: 'world',
          },
          app: {
            name: 'App Name',
          },
          blocks: {},
        },
      },
    });
  });

  it('should omit messages for pages that do not exist', async () => {
    await AppMessages.create({
      language: 'en',
      messages: {
        messageIds: {
          hello: 'world',
        },
        blocks: {},
        app: {
          name: 'App Name',
          'pages.does-not-exist': 'Does not exist',
        },
      },
      AppId: app.id,
    });
    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchObject({
      status: 200,
      data: {
        language: 'en',
        messages: {
          messageIds: {
            hello: 'world',
          },
          app: {
            name: 'App Name',
          },
          blocks: {},
        },
      },
    });
  });

  it('should omit messages for pages that have been removed', async () => {
    await app.update({
      definition: {
        name: 'Test App',
        pages: [
          {
            name: 'Test Page',
            blocks: [],
          },
        ],
      },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: {
        app: {
          name: 'App name',
          'pages.test-page': 'Page name',
        },
        messageIds: {
          test: 'Test message',
        },
      },
    });
    const { data, status } = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(status).toBe(200);
    expect(data.messages).toMatchObject({
      app: {
        name: 'App name',
        'pages.test-page': 'Page name',
      },
      messageIds: {
        test: 'Test message',
      },
    });

    await app.update({
      definition: {
        name: 'Test App',
        pages: [],
      },
    });
    const { data: updatedMessages } = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(updatedMessages.messages.app['pages.test-page']).toBeUndefined();
  });

  it('should return a 404 if a language is not supported', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en-GB`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Language “en-GB” could not be found",
        "statusCode": 404,
      }
    `);
  });

  it('should return a 200 if a language is not supported, but is the default language', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl-nl',
      },
    });
    const response = await request.get(`/api/apps/${app.id}/messages/nl-nl`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "nl-nl",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
  });

  it('should return a 200 if a en is not supported and is default language unset', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages/en`);
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
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

    const response = await request.get(`/api/apps/${app.id}/messages/en-GB?merge=true`);

    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en-gb",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
          },
          "blocks": {},
          "core": Any<Object>,
          "messageIds": {
            "bla": "blah",
            "test": "Test.",
          },
        },
      }
    `,
    );
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
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
            "pages.test": "test",
          },
          "blocks": {
            "@appsemble/form": {
              "0.0.0": {
                "form": "form",
              },
            },
            "@testorganization/test": {
              "0.0.0": {
                "bla": "bla",
                "foo": "bar",
              },
              "0.0.1": {
                "bla": "blablabla",
                "foo": "bar",
                "test": "test",
              },
            },
          },
          "core": Any<Object>,
          "messageIds": {},
        },
      }
    `,
    );
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
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "nl",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
            "pages.test": "test",
          },
          "blocks": {
            "@testorganization/test": {
              "0.0.0": {
                "bla": "bla",
                "foo": "foo but dutch",
              },
            },
          },
          "core": Any<Object>,
          "messageIds": {
            "test": "test translation",
          },
        },
      }
    `,
    );
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
    expect(response).toMatchInlineSnapshot(
      { data: { messages: { core: expect.any(Object) } } },
      `
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      {
        "language": "en-gb",
        "messages": {
          "app": {
            "description": "Description",
            "name": "Test App",
            "pages.test": "test",
          },
          "blocks": {
            "@testorganization/test": {
              "0.0.0": {
                "bla": "blah",
                "foo": "bar",
              },
            },
          },
          "core": Any<Object>,
          "messageIds": {
            "test": "test translation",
          },
        },
      }
    `,
    );
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Maintainer',
    });
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
            'pages.test-page': 'test-page',
            'pages.test-page-2': 'test-page-2',
            'pages.test-page.blocks.0.test': 'foo',
            'pages.test-page-2.blocks.0.test': 'foo',
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
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Maintainer',
    });
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
        app: { 'pages.test-page.blocks.0.test': 'Bla' },

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
            'pages.test-page': 'test-page',
            'pages.test-page-2': 'test-page-2',
            'pages.test-page.blocks.0.test': 'Bla',
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
