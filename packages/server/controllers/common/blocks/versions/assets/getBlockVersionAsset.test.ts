import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockAsset,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { createTestUser } from '../../../../../utils/test/authorization.js';
import { useTestDatabase } from '../../../../../utils/test/testSchema.js';

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

describe('getBlockVersionAsset', () => {
  it('should serve a block asset', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response.headers['content-type']).toBe('application/javascript; charset=utf-8');
    expect(response.data).toBe('console.log("Hello world!")');
  });

  it('should respond with 404 the version mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.4/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 if the organization mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@nope/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 if the block name mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/nope/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block version not found',
        statusCode: 404,
      },
    });
  });

  it('should respond with 404 no filename matches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      filename: 'hello.js',
      content: 'console.log("Hello world!")',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'nope.js' },
    });
    expect(response).toMatchObject({
      status: 404,
      data: {
        error: 'Not Found',
        message: 'Block has no asset named "nope.js"',
        statusCode: 404,
      },
    });
  });
});
