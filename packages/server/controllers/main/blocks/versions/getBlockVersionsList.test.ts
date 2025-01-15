import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import { createTestUser } from '../../../../utils/test/authorization.js';

let user: User;

describe('getBlockVersionsList', () => {
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

  it('should return an error if no versions exist for a block', async () => {
    const response = await request.get('/api/blocks/@xkcd/block-test/versions/list');
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

  it('should return a list of all the versions published for a block', async () => {
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'block-test',
      version: '0.0.1',
    });
    await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'block-test',
      version: '0.0.2',
    });
    const { data } = await request.get('/api/blocks/@xkcd/block-test/versions/list');

    expect(data).toStrictEqual(expect.arrayContaining(['0.0.1', '0.0.2']));
  });
});
