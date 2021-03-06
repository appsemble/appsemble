import { createFixtureStream, readFixture } from '@appsemble/node-utils';
import { install } from '@sinonjs/fake-timers';
import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { omit } from 'lodash';

import { BlockAsset, BlockMessages, BlockVersion, Member, Organization } from '../models';
import { setArgv } from '../utils/argv';
import { createServer } from '../utils/createServer';
import { authorizeClientCredentials, createTestUser } from '../utils/test/authorization';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';

beforeAll(createTestSchema('blocks'));

beforeEach(async () => {
  setArgv({ host: 'http://localhost', secret: 'test' });
  const server = await createServer();
  const user = await createTestUser();
  const organization = await Organization.create({
    id: 'xkcd',
    name: 'xkcd',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
  await setTestApp(server);
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getBlock', () => {
  it('should be possible to retrieve a block definition', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: original } = await request.post('/api/blocks', formData);
    const { data: retrieved } = await request.get('/api/blocks/@xkcd/test');

    expect(retrieved).toStrictEqual(original);
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await request.get('/api/blocks/@non/existent');
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });
});

describe('queryBlocks', () => {
  it('should be possible to query block definitions', async () => {
    const formDataA = new FormData();
    formDataA.append('name', '@xkcd/apple');
    formDataA.append('version', '0.0.0');
    formDataA.append('description', 'I’ve got an apple.');
    formDataA.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: apple } = await request.post('/api/blocks', formDataA);

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/pen');
    formDataB.append('version', '0.0.0');
    formDataB.append('description', 'I’ve got a pen.');
    formDataB.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: pen } = await request.post('/api/blocks', formDataB);

    const { data: bam } = await request.get('/api/blocks');
    expect(bam).toMatchObject([
      omit(apple, ['files', 'languages']),
      omit(pen, ['files', 'languages']),
    ]);
  });
});

describe('publishBlock', () => {
  it('should be possible to upload encoded file paths', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: encodeURIComponent('build/testblock.js'),
    });

    await authorizeClientCredentials('blocks:write');
    const { data, status } = await request.post('/api/blocks', formData);

    expect(data).toStrictEqual({
      actions: null,
      events: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      iconUrl: null,
      languages: null,
      layout: null,
      parameters: null,
      version: '1.32.9',
      description: null,
      longDescription: null,
    });

    expect(status).toBe(201);
  });

  it('should accept messages when publishing blocks', async () => {
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
    const { status } = await request.post('/api/blocks', formData);
    const blockVersionMessages = await BlockVersion.findOne({
      where: { version: '1.32.9', OrganizationId: 'xkcd', name: 'standing' },
      include: [BlockMessages],
    });

    expect(status).toBe(201);
    expect(blockVersionMessages.BlockMessages).toMatchObject([
      {
        language: 'en',
        messages: { test: 'foo' },
      },
      {
        language: 'nl',
        messages: { test: 'bar' },
      },
    ]);
  });

  it('should not accept messages when publishing blocks if english is excluded', async () => {
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
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'JSON schema validation failed' },
    });
  });

  it('should not accept messages when publishing blocks if english has empty values', async () => {
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
        en: { test: '' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'JSON schema validation failed' },
    });
  });

  it('should check for mismatching keys in messages when publishing blocks', async () => {
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
        en: { test: 'foo', baz: '123' },
        nl: { test: 'bar' },
      }),
    );

    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Language ‘nl’ contains mismatched keys compared to ‘en’.' },
    });
  });

  it('should not accept invalid action names', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('actions', JSON.stringify({ $any: {}, $foo: {} }));
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    await authorizeClientCredentials('blocks:write');
    const response = await request.post('/api/blocks', formData);

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Action “$foo” does match /^[a-z]\\w*$/' },
    });
  });

  it('should not be possible to register the same block version twice', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('description', 'This block has been uploaded for the purpose of unit testing.');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const formData2 = new FormData();
    formData2.append('name', '@xkcd/standing');
    formData2.append(
      'description',
      'This block has been uploaded for the purpose of unit testing.',
    );
    formData2.append('version', '1.32.9');
    formData2.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData2.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data } = await request.post('/api/blocks', formData2);

    expect(data).toStrictEqual({
      error: 'Conflict',
      message:
        'Version 1.32.9 is equal to or lower than the already existing @xkcd/standing@1.32.9.',
      statusCode: 409,
    });
  });

  it('should require at least one file', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');

    await authorizeClientCredentials('blocks:write');
    const { data, status } = await request.post('/api/blocks', formData);

    expect(data).toStrictEqual({
      errors: [
        {
          code: 'OBJECT_MISSING_REQUIRED_PROPERTY',
          description: expect.any(String),
          message: 'Missing required property: files',
          params: ['files'],
          path: [],
        },
      ],
      message: 'JSON schema validation failed',
    });
    expect(status).toBe(400);
  });
});

describe('getBlockVersion', () => {
  it('should be possible to retrieve a block version', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);

    const { data: retrieved, status } = await request.get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved.iconUrl).toBeNull();
    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
  });

  it('should use the block’s icon in the iconUrl if the block has one', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });
    formData.append('icon', createFixtureStream('nodejs-logo.png'), { filepath: 'icon.png' });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);
    const { data: retrieved, status } = await request.get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toStrictEqual('/api/blocks/@xkcd/standing/versions/1.32.9/icon');
    expect(status).toBe(200);
  });

  it('should use the organization icon in the iconUrl if the block does not have one', async () => {
    const clock = install();
    await Organization.update(
      { icon: await readFixture('nodejs-logo.png') },
      { where: { id: 'xkcd' } },
    );
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'standing.png',
    });
    formData.append('files', createFixtureStream('standing.png'), {
      filepath: 'testblock.js',
    });

    await authorizeClientCredentials('blocks:write');
    const { data: created } = await request.post('/api/blocks', formData);

    const { data: retrieved, status } = await request.get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(retrieved.iconUrl).toStrictEqual(
      '/api/organizations/xkcd/icon?updated=1970-01-01T00%3A00%3A00.000Z',
    );
    expect(status).toBe(200);
    clock.uninstall();
  });

  it('should respond with 404 when trying to fetch a non existing block version', async () => {
    const { data, status } = await request.get('/api/blocks/@xkcd/standing/versions/3.1.4');
    expect(status).toBe(404);
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block version not found',
      statusCode: 404,
    });
  });
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
        files: ['standing.png', 'testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
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
        files: ['testblock.js'],
        iconUrl: null,
        languages: null,
        layout: null,
        parameters: null,
        version: '1.32.9',
      },
      {
        name: '@xkcd/standing',
        description: 'Version 1.4.0!',
        longDescription: null,
        actions: null,
        events: null,
        files: ['testblock.js'],
        iconUrl: null,
        languages: ['en'],
        layout: null,
        parameters: null,
        version: '1.4.0',
      },
    ]);
  });
});

describe('getBlockAsset', () => {
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
    expect(response.data).toStrictEqual('console.log("Hello world!")');
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

describe('getBlockMessages', () => {
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

describe('getBlockIcon', () => {
  it('should serve the block icon', async () => {
    const icon = await readFixture('testpattern.png');
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.33.8');
    formData.append('files', Buffer.from(''), 'test.js');
    formData.append('icon', icon);

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.33.8/icon', {
      responseType: 'arraybuffer',
    });
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await request.get('/api/blocks/@non/existent');
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });

  it('should return the default icon if no block icon was defined', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.33.8');
    formData.append('files', Buffer.from(''), 'test.js');

    await authorizeClientCredentials('blocks:write');
    await request.post('/api/blocks', formData);

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.33.8/icon', {
      responseType: 'arraybuffer',
    });

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });
});
