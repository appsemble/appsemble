import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockMessages,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { createTestUser } from '../../../../../utils/test/authorization.js';

let user: User;

describe('getBlockVersionMessages', () => {
  beforeEach(async () => {
    setArgv({ host: 'http://localhost', secret: 'test' });
    const server = await createServer();
    user = await createTestUser();
    const organization = await Organization.create({
      id: 'xkcd',
      name: 'xkcd',
    });
    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: 'Maintainer',
    });
    await setTestApp(server);
  });

  it('should download block messages', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockMessages.create({
      BlockVersionId: block.id,
      language: 'en',
      messages: { hello: 'Hello' },
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 200,
      data: { hello: 'Hello' },
    });
  });

  it('should return 404 if the block messages don’t exist', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block has no messages for language "en"',
        statusCode: 404,
      },
    });
  });

  it('should return 404 if the block doesn’t exist', async () => {
    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/messages/en');
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });
});
