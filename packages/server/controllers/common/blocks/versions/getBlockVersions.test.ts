import { createFixtureStream } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { beforeEach, describe, expect, it } from 'vitest';

import { Organization, OrganizationMember, type User } from '../../../../models/index.js';
import { setArgv } from '../../../../utils/argv.js';
import { createServer } from '../../../../utils/createServer.js';
import {
  authorizeClientCredentials,
  createTestUser,
} from '../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../utils/test/testSchema.js';

useTestDatabase(import.meta);

let user: User;

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

describe('getBlockVersions', () => {
  it('should be possible to fetch uploaded block versions', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('description', 'Version 1.32.9!');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['standing.png', 'testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
        wildcardActions: false,
      },
    ]);
  });

  it('should not be possible to fetch block versions of non-existent blocks', async () => {
    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block not found.',
    });
  });

  it('should order block versions by most recent first', async () => {
    const formDataA = new FormData();
    formDataA.append('name', '@xkcd/standing');
    formDataA.append('description', 'Version 1.4.0!');
    formDataA.append('version', '1.4.0');
    formDataA.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    formDataA.append('messages', JSON.stringify({ en: { foo: 'Foo' } }));
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formDataA);

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/standing');
    formDataB.append('description', 'Version 1.32.9!');
    formDataB.append('version', '1.32.9');
    formDataB.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formDataB);

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
        wildcardActions: false,
      },
      {
        name: '@xkcd/standing',
        description: 'Version 1.4.0!',
        longDescription: null,
        actions: null,
        events: null,
        examples: [],
        files: ['testblock.js'],
        iconUrl: null,
        languages: ['en'],
        layout: null,
        parameters: null,
        version: '1.4.0',
        wildcardActions: false,
      },
    ]);
  });
});
