import { createFixtureStream, getAppsembleMessages } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
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

describe('getAppLanguages', () => {
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
      role: PredefinedOrganizationRole.Owner,
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

  it('should return a the default app language if no translations are available', async () => {
    await app.update({
      definition: {
        ...app.definition,
        defaultLanguage: 'nl-nl',
      },
    });
    const response = await request.get(`/api/apps/${app.id}/messages`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "nl-nl",
      ]
    `);
  });

  it('should fallback to the default value of defaultLanguage', async () => {
    const response = await request.get(`/api/apps/${app.id}/messages`);
    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "en",
      ]
    `);
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

    const response = await request.get(`/api/apps/${app.id}/messages`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: application/json; charset=utf-8

      [
        "en",
        "en-gb",
        "nl",
      ]
    `);
  });

  it('should include messages with languages', async () => {
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

    const response = await request.get(`/api/apps/${app.id}/messages?includeMessages=true`);

    expect(response.data).toMatchObject([
      { language: 'en', messages: { messageIds: { test: 'Passed with flying colors' } } },
      { language: 'en-gb', messages: { messageIds: { test: 'Passed with flying colours' } } },
      { language: 'nl', messages: { messageIds: { test: 'Geslaagd met vliegende kleuren' } } },
    ]);
  });

  it('should include defaults for app messages if override is set to false', async () => {
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Maintainer,
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
    await AppMessages.create({
      AppId: app.id,
      language: 'en',
      messages: {
        messageIds: { bla: 'bla' },
      },
    });
    await AppMessages.create({
      AppId: app.id,
      language: 'nl',
      messages: {
        messageIds: { bla: 'bla in nl' },
      },
    });

    const messages = await getAppsembleMessages('en');
    const messagesNl = await getAppsembleMessages('nl');

    const response = await request.get(
      `/api/apps/${app.id}/messages?includeMessages=true&override=false`,
    );

    expect(response).toMatchObject({
      status: 200,
      data: [
        {
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
        {
          language: 'nl',
          messages: {
            messageIds: {},
            core: {
              ...Object.fromEntries(
                Object.entries(messagesNl).filter(
                  ([key]) => key.startsWith('app') || key.startsWith('react-components'),
                ),
              ),
            },
            app: {
              name: 'Test App',
              description: 'Description',
              'pages.test-page': 'test-page',
              'pages.test-page-2': 'test-page-2',
              'pages.test-page.blocks.0.test': 'bar',
              'pages.test-page-2.blocks.0.test': 'bar',
            },
            blocks: {
              '@xkcd/standing': {
                '1.32.9': {
                  test: 'bar',
                },
              },
            },
          },
        },
      ],
    });
  });
});
