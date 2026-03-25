import { resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv } from '@appsemble/server';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import concat from 'concat-stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteBlock, traverseBlockThemes } from './block.js';
import { initAxios } from './initAxios.js';
import { makeProjectPayload } from './project.js';
import { authorizeCLI } from './testUtils.js';

const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let testApp: AxiosTestInstance;
let user: models.User;
let organization: models.Organization;

const { App, BlockVersion, Organization, OrganizationMember, Theme, getAppDB } = models;

describe('block', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    setArgv(argv);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const server = await createServer();
    testApp = await setTestApp(server);
    initAxios({ remote: testApp.defaults.baseURL! });
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

  describe('makeProjectPayload', () => {
    it('should create a form-data payload', async () => {
      const payload = await makeProjectPayload({
        webpack: 'webpack.config',
        name: '@org/block',
        output: 'output',
        version: '1.2.3',
        dir: resolveFixture('makeProjectPayload/no-icon'),
      });
      const [formData] = payload;
      const boundary = formData.getBoundary();
      const buffer = await new Promise((resolve) => {
        formData.pipe(concat(resolve));
      });
      expect(String(buffer)).toBe(`--${boundary}\r
Content-Disposition: form-data; name="actions"\r
\r
{"onClick":{}}\r
--${boundary}\r
Content-Disposition: form-data; name="events"\r
\r
{"listen":{"test":{}}}\r
--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
@org/block\r
--${boundary}\r
Content-Disposition: form-data; name="parameters"\r
\r
{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"type":{"type":"object"}},"required":["type"],"additionalProperties":false}\r
--${boundary}\r
Content-Disposition: form-data; name="version"\r
\r
1.2.3\r
--${boundary}\r
Content-Disposition: form-data; name="files"; filename="block.js"\r
Content-Type: application/javascript\r
\r
export const string = 'no-icon';
\r
--${boundary}--\r
`);
    });

    it('should include an icon if one is present', async () => {
      const payload = await makeProjectPayload({
        webpack: 'webpack.config',
        name: '@org/block',
        output: 'output',
        version: '1.2.3',
        dir: resolveFixture('makeProjectPayload/with-icon'),
      });
      const [formData] = payload;
      const boundary = formData.getBoundary();
      const buffer = await new Promise((resolve) => {
        formData.pipe(concat(resolve));
      });
      expect(String(buffer)).toBe(`--${boundary}\r
Content-Disposition: form-data; name="actions"\r
\r
{"onClick":{}}\r
--${boundary}\r
Content-Disposition: form-data; name="events"\r
\r
{"listen":{"test":{}}}\r
--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
@org/block\r
--${boundary}\r
Content-Disposition: form-data; name="parameters"\r
\r
{"$schema":"http://json-schema.org/draft-07/schema#","type":"object","properties":{"type":{"type":"object"}},"required":["type"],"additionalProperties":false}\r
--${boundary}\r
Content-Disposition: form-data; name="version"\r
\r
1.2.3\r
--${boundary}\r
Content-Disposition: form-data; name="icon"; filename="icon.svg"\r
Content-Type: image/svg+xml\r
\r
<?xml version="1.0" standalone="no"?>
<svg />
\r
--${boundary}\r
Content-Disposition: form-data; name="files"; filename="block.js"\r
Content-Type: application/javascript\r
\r
export const string = 'with-icon';
\r
--${boundary}--\r
`);
    });
  });

  describe('deleteBlock', () => {
    it('should delete a block', async () => {
      const block = await BlockVersion.create({
        OrganizationId: organization.id,
        name: 'test',
        version: '0.0.0',
      });
      const clientCredentials = await authorizeCLI('blocks:delete', testApp);
      await deleteBlock({
        remote: testApp.defaults.baseURL!,
        clientCredentials,
        blockName: block.name,
        blockVersion: block.version,
        organization: organization.id,
      });
      const foundBlocks = await BlockVersion.findAll();
      expect(foundBlocks).toStrictEqual([]);
    });
  });

  describe('traverseBlockThemes', () => {
    it('should upload css from a file in the app directory', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await BlockVersion.create({
        name: 'test',
        OrganizationId: 'appsemble',
        version: '0.0.0',
        parameters: {
          type: 'object',
          properties: {
            foo: {
              type: 'number',
            },
          },
        },
      });
      await authorizeCLI('apps:write', testApp);
      await traverseBlockThemes(
        resolveFixture('apps/test'),
        app.id,
        testApp.defaults.baseURL!,
        false,
      );
      const { AppBlockStyle } = await getAppDB(app.id);
      const style = (await AppBlockStyle.findOne())!;
      expect(style.dataValues).toMatchInlineSnapshot(`
        {
          "block": "@appsemble/test",
          "created": 1970-01-01T00:00:00.000Z,
          "style": ".tux {
          color: rgb(0 0 0);
        }",
          "updated": 1970-01-01T00:00:00.000Z,
        }
      `);
    });

    it('should throw if the block does not exist', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await authorizeCLI('apps:write', testApp);
      await expect(() =>
        traverseBlockThemes(resolveFixture('apps/test'), app.id, testApp.defaults.baseURL!, false),
      ).rejects.toThrow('Request failed with status code 404');
      const { AppBlockStyle } = await getAppDB(app.id);
      const style = await AppBlockStyle.findOne();
      expect(style).toBeNull();
    });

    it('should not upload css from core and shared directories', async () => {
      const app = await App.create({
        path: 'test-app',
        definition: { name: 'Test App', defaultPage: 'Test Page' },
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        visibility: 'public',
        OrganizationId: organization.id,
      });
      await BlockVersion.create({
        name: 'test',
        OrganizationId: 'appsemble',
        version: '0.0.0',
        parameters: {
          type: 'object',
          properties: {
            foo: {
              type: 'number',
            },
          },
        },
      });
      await authorizeCLI('apps:write', testApp);
      await traverseBlockThemes(
        resolveFixture('apps/test'),
        app.id,
        testApp.defaults.baseURL!,
        false,
      );
      const style = await Theme.findAll();
      expect(style).toStrictEqual([]);
    });
  });
});
