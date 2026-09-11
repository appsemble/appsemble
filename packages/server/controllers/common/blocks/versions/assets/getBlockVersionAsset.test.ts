import { uploadS3File } from '@appsemble/node-utils';
import { request, setTestApp } from 'axios-test-instance';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  BlockAsset,
  BlockVersion,
  Organization,
  OrganizationMember,
  type User,
} from '../../../../../models/index.js';
import { getBlockAssetsBucketName } from '../../../../../utils/blockAssets.js';
import { setArgv } from '../../../../../utils/argv.js';
import { createServer } from '../../../../../utils/createServer.js';
import { createTestUser } from '../../../../../utils/test/authorization.js';

let user: User;

describe('getBlockVersionAsset', () => {
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

  it('should serve a database-backed block asset that has not been migrated to S3', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      content: Buffer.from('console.log("Hello from Postgres!")'),
      filename: 'hello.js',
      mime: 'application/javascript',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('application/javascript; charset=utf-8');
    expect(response.headers['cache-control']).toBe('public,max-age=31536000,immutable');
    expect(response.data).toBe('console.log("Hello from Postgres!")');
  });

  it('should serve an S3-backed block asset', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    const content = Buffer.from('console.log("Hello from S3!")');
    const storageKey = 'xkcd/test/1.2.3/hello.js';

    await uploadS3File(getBlockAssetsBucketName(), storageKey, content, content.byteLength);
    await BlockAsset.create({
      BlockVersionId: block.id,
      content,
      filename: 'hello.js',
      mime: 'application/javascript',
      size: content.byteLength,
      storageKey,
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });

    expect(response.headers['cache-control']).toBe('public,max-age=31536000,immutable');
    expect(response.headers['content-length']).toBe(String(content.byteLength));
    expect(response.headers.etag).toBeDefined();
    expect(response.data).toBe('console.log("Hello from S3!")');
  });

  it('should fall back to database content when the S3 object is missing', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      content: Buffer.from('console.log("fallback")'),
      filename: 'hello.js',
      mime: 'application/javascript',
      storageKey: 'xkcd/test/1.2.3/missing/hello.js',
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.2.3/asset', {
      params: { filename: 'hello.js' },
    });

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('public,max-age=31536000,immutable');
    expect(response.data).toBe('console.log("fallback")');
  });

  it('should respond with 404 the version mismatches', async () => {
    const block = await BlockVersion.create({
      OrganizationId: 'xkcd',
      name: 'test',
      version: '1.2.3',
    });
    await BlockAsset.create({
      BlockVersionId: block.id,
      content: Buffer.from('console.log("Hello world!")'),
      filename: 'hello.js',
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
      content: Buffer.from('console.log("Hello world!")'),
      filename: 'hello.js',
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
      content: Buffer.from('console.log("Hello world!")'),
      filename: 'hello.js',
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
      content: Buffer.from('console.log("Hello world!")'),
      filename: 'hello.js',
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
