import { createReadStream, promises as fs } from 'fs';
import { join } from 'path';

import { request, setTestApp } from 'axios-test-instance';
import FormData from 'form-data';
import { omit } from 'lodash';

import { Member, Organization, User } from '../models';
import { createServer } from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import { testToken } from '../utils/test/testToken';

let authorization: string;
let user: User;
let clientToken: string;

beforeAll(createTestSchema('blocks'));

beforeEach(async () => {
  const server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
  ({ clientToken, user } = await testToken('blocks:write'));
  const organization = await Organization.create({
    id: 'xkcd',
    name: 'xkcd',
  });
  await Member.create({ OrganizationId: organization.id, UserId: user.id, role: 'Maintainer' });
  authorization = `Bearer ${clientToken}`;
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
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });

    const { data: original } = await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    const { data: retrieved } = await request.get('/api/blocks/@xkcd/test');
    expect(retrieved).toStrictEqual(omit(original, ['files']));
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
    formDataA.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });

    const { data: apple } = await request.post('/api/blocks', formDataA, {
      headers: { authorization, ...formDataA.getHeaders() },
    });

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/pen');
    formDataB.append('version', '0.0.0');
    formDataB.append('description', 'I’ve got a pen.');
    formDataB.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });

    const { data: pen } = await request.post('/api/blocks', formDataB, {
      headers: { authorization, ...formDataB.getHeaders() },
    });

    const { data: bam } = await request.get('/api/blocks');
    expect(bam).toMatchObject([omit(apple, ['files']), omit(pen, ['files'])]);
  });
});

describe('publishBlock', () => {
  it('should be possible to upload encoded file paths', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filename: encodeURIComponent('build/standing.png'),
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: encodeURIComponent('build/testblock.js'),
    });

    const { data, status } = await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      actions: null,
      events: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      iconUrl: '/api/blocks/@xkcd/standing/versions/1.32.9/icon',
      layout: null,
      resources: null,
      parameters: null,
      version: '1.32.9',
      description: null,
      longDescription: null,
    });

    expect(status).toBe(201);
  });

  it('should not accept invalid action names', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('actions', JSON.stringify({ $any: {}, $foo: {} }));
    formData.append('version', '1.32.9');
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });
    const response = await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

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
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });

    await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    const formData2 = new FormData();
    formData2.append('name', '@xkcd/standing');
    formData2.append(
      'description',
      'This block has been uploaded for the purpose of unit testing.',
    );
    formData2.append('version', '1.32.9');
    formData2.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData2.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });

    const { data } = await request.post('/api/blocks', formData2, {
      headers: { authorization, ...formData2.getHeaders() },
    });

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

    const { data, status } = await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

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
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });

    const { data: created } = await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    const { data: retrieved, status } = await request.get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
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
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'standing.png',
    });
    formData.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });
    await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        iconUrl: '/api/blocks/@xkcd/standing/versions/1.32.9/icon',
        layout: null,
        parameters: null,
        resources: null,
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
    formDataA.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });
    await request.post('/api/blocks', formDataA, {
      headers: { authorization, ...formDataA.getHeaders() },
    });

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/standing');
    formDataB.append('description', 'Version 1.32.9!');
    formDataB.append('version', '1.32.9');
    formDataB.append('files', createReadStream(join(__dirname, '__fixtures__/standing.png')), {
      filepath: 'testblock.js',
    });
    await request.post('/api/blocks', formDataB, {
      headers: { authorization, ...formDataB.getHeaders() },
    });

    const { data } = await request.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        longDescription: null,
        actions: null,
        events: null,
        iconUrl: '/api/blocks/@xkcd/standing/versions/1.32.9/icon',
        layout: null,
        parameters: null,
        resources: null,
        version: '1.32.9',
      },
      {
        name: '@xkcd/standing',
        description: 'Version 1.4.0!',
        longDescription: null,
        actions: null,
        events: null,
        iconUrl: '/api/blocks/@xkcd/standing/versions/1.4.0/icon',
        layout: null,
        parameters: null,
        resources: null,
        version: '1.4.0',
      },
    ]);
  });
});

describe('getBlockIcon', () => {
  it('should serve the block icon', async () => {
    const icon = await fs.readFile(join(__dirname, '__fixtures__/testpattern.png'));
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.33.8');
    formData.append('files', Buffer.from(''), 'test.js');
    formData.append('icon', icon);

    await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

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

    await request.post('/api/blocks', formData, {
      headers: { authorization, ...formData.getHeaders() },
    });

    const response = await request.get('/api/blocks/@xkcd/test/versions/1.33.8/icon', {
      responseType: 'arraybuffer',
    });

    expect(response.headers['content-type']).toBe('image/png');
    expect(response.data).toMatchImageSnapshot();
  });
});
