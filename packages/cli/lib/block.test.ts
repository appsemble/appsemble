import { resolveFixture } from '@appsemble/node-utils';
import { createServer, createTestUser, models, setArgv, useTestDatabase } from '@appsemble/server';
import { type AxiosTestInstance, setTestApp } from 'axios-test-instance';
import concat from 'concat-stream';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteBlock } from './block.js';
import { initAxios } from './initAxios.js';
import { makeProjectPayload } from './project.js';
import { authorizeCLI } from './testUtils.js';

useTestDatabase(import.meta);
const argv = { host: 'http://localhost', secret: 'test', aesSecret: 'testSecret' };
let testApp: AxiosTestInstance;

const { BlockVersion, Organization, OrganizationMember } = models;

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
  let user: models.User;
  let organization: models.Organization;

  beforeAll(() => {
    vi.useFakeTimers();
    setArgv(argv);
  });

  beforeEach(async () => {
    vi.clearAllTimers();
    vi.setSystemTime(0);
    const server = await createServer();
    testApp = await setTestApp(server);
    initAxios({ remote: testApp.defaults.baseURL });
    user = await createTestUser();
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Owner',
    });
  });

  it('should delete a block', async () => {
    const block = await BlockVersion.create({
      OrganizationId: organization.id,
      name: 'test',
      version: '0.0.0',
    });
    const clientCredentials = await authorizeCLI('blocks:delete', testApp);
    await deleteBlock({
      remote: testApp.defaults.baseURL,
      clientCredentials,
      blockName: block.name,
      blockVersion: block.version,
      organization: organization.id,
    });
    const foundBlocks = await BlockVersion.findAll();
    expect(foundBlocks).toStrictEqual([]);
  });
});
