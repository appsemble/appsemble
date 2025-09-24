import { createFormData } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { request, setTestApp } from 'axios-test-instance';
import stripIndent from 'strip-indent';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  App,
  BlockVersion,
  getAppDB,
  Organization,
  OrganizationMember,
  type User,
} from '../../../models/index.js';
import { setArgv } from '../../../utils/argv.js';
import { createServer } from '../../../utils/createServer.js';
import { authorizeStudio, createTestUser } from '../../../utils/test/authorization.js';

let organization: Organization;
let user: User;

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };

describe('setAppBlockStyle', () => {
  beforeAll(async () => {
    vi.useFakeTimers();
    setArgv(argv);
    const server = await createServer();
    await setTestApp(server);
  });

  beforeEach(async () => {
    // https://github.com/vitest-dev/vitest/issues/1154#issuecomment-1138717832
    vi.clearAllTimers();
    vi.setSystemTime(0);
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });
    await Organization.create({ id: 'appsemble', name: 'Appsemble' });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should validate and update css when updating an app’s block style', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: yellow; }',
    });

    const style = await request.get(`/api/apps/${id}/style/block/@appsemble/testblock`);

    expect(response).toMatchInlineSnapshot('HTTP/1.1 204 No Content');
    expect(style).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8

      body { color: yellow; }
    `);
  });

  it('should delete block stylesheet when uploading empty stylesheets for an app', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
      },
      { raw: true },
    );

    authorizeStudio();
    const responseA = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: blue; }',
    });
    expect(responseA).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    authorizeStudio();
    const responseB = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: ' ',
    });

    expect(responseB).toMatchInlineSnapshot('HTTP/1.1 204 No Content');

    const { AppBlockStyle } = await getAppDB(id);
    const style = await AppBlockStyle.findOne({
      where: { block: '@appsemble/testblock' },
    });
    expect(style).toBeNull();
  });

  it('should not update an app if it is currently locked', async () => {
    await BlockVersion.create({
      name: 'testblock',
      OrganizationId: 'appsemble',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create(
      {
        path: 'bar',
        definition: {
          name: 'Test App',
          defaultPage: 'Test Page',
          pages: [{ name: 'Test', blocks: { type: 'testblock', version: '0.0.0' } }],
        },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: organization.id,
        locked: 'studioLock',
      },
      { raw: true },
    );

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/testblock`, {
      style: 'body { color: yellow; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 403 Forbidden
      Content-Type: application/json; charset=utf-8

      {
        "error": "Forbidden",
        "message": "App is currently locked.",
        "statusCode": 403,
      }
    `);
  });

  it('should not allow invalid stylesheets when uploading block stylesheets to an app', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'styledblock',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    const { id } = await App.create({
      path: 'b',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      visibility: 'unlisted',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/styledblock`, {
      style: 'invalidCss',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "error": "Bad Request",
        "message": "Provided CSS was invalid.",
        "statusCode": 400,
      }
    `);
  });

  it('should not allow uploading block stylesheets to non-existent apps', async () => {
    await BlockVersion.create({
      OrganizationId: 'appsemble',
      name: 'block',
      description: 'This is a test block for testing purposes.',
      version: '0.0.0',
    });

    authorizeStudio();
    const response = await request.post('/api/apps/0/style/block/@appsemble/block', {
      style: 'body { color: red; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "App not found",
        "statusCode": 404,
      }
    `);
  });

  it('should not allow uploading block stylesheets for non-existent blocks', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    authorizeStudio();
    const response = await request.post(`/api/apps/${id}/style/block/@appsemble/doesntexist`, {
      style: 'body { color: red; }',
    });

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 404 Not Found
      Content-Type: application/json; charset=utf-8

      {
        "error": "Not Found",
        "message": "Block not found",
        "statusCode": 404,
      }
    `);
  });

  it('should return an empty response on non-existent block stylesheets', async () => {
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });

    const response = await request.get(`/api/apps/${id}/style/block/@appsemble/doesntexist`);

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 200 OK
      Content-Type: text/css; charset=utf-8
    `);
  });

  it('should not allow to update an app using non-existent blocks', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
        'organization.id': organization.id,
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: '@non/existent'
                  version: 0.0.0'
        `),
      }),
    );

    expect(response).toMatchSnapshot();
  });

  it('should not allow to update an app using non-existent block versions', async () => {
    authorizeStudio();
    const { id } = await App.create({
      path: 'bar',
      definition: { name: 'Test App', defaultPage: 'Test Page' },
      vapidPublicKey: 'a',
      vapidPrivateKey: 'b',
      OrganizationId: organization.id,
    });
    const response = await request.patch(
      `/api/apps/${id}`,
      createFormData({
        yaml: stripIndent(`
          name: Test App
          defaultPage: Test Page
          pages:
            - name: Test Page
              blocks:
                - type: test
                  version: 0.0.1
        `),
      }),
    );

    expect(response).toMatchInlineSnapshot(`
      HTTP/1.1 400 Bad Request
      Content-Type: application/json; charset=utf-8

      {
        "data": {
          "errors": [
            {
              "instance": "test",
              "message": "is not a known block type",
              "path": [
                "pages",
                0,
                "blocks",
                0,
                "type",
              ],
              "property": "instance.pages[0].blocks[0].type",
              "stack": "instance.pages[0].blocks[0].type is not a known block type",
            },
          ],
        },
        "error": "Bad Request",
        "message": "App validation failed",
        "statusCode": 400,
      }
    `);
  });
});
