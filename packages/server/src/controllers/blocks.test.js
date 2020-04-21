import { createInstance } from 'axios-test-instance';
import FormData from 'form-data';
import fs from 'fs-extra';
import { omit } from 'lodash';
import path from 'path';

import createServer from '../utils/createServer';
import { closeTestSchema, createTestSchema, truncate } from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';

let server;
let instance;
let headers;
let user;
let clientToken;

beforeAll(createTestSchema('blocks'));

beforeAll(async () => {
  server = await createServer({ argv: { host: 'http://localhost', secret: 'test' } });
}, 10e3);

beforeEach(async () => {
  ({ clientToken, user } = await testToken('blocks:write'));
  await user.createOrganization(
    {
      id: 'xkcd',
      name: 'xkcd',
    },
    { through: { role: 'Maintainer' } },
  );
  headers = { headers: { authorization: `Bearer ${clientToken}` } };
  instance = await createInstance(server);
});

afterEach(async () => {
  await instance.close();
});

afterEach(truncate);

afterAll(closeTestSchema);

describe('getBlock', () => {
  it('should be possible to retrieve a block definition', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/test');
    formData.append('description', 'foo');
    formData.append('version', '1.32.9');
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );

    const { data: original } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const { data: retrieved } = await instance.get('/api/blocks/@xkcd/test');
    expect(retrieved).toStrictEqual(omit(original, ['files']));
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await instance.get('/api/blocks/@non/existent');
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
    formDataA.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );

    const { data: apple } = await instance.post('/api/blocks', formDataA, {
      headers: { ...headers.headers, ...formDataA.getHeaders() },
    });

    const formDataB = new FormData();
    formDataB.append('name', '@xkcd/pen');
    formDataB.append('version', '0.0.0');
    formDataB.append('description', 'I’ve got a pen.');
    formDataB.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );

    const { data: pen } = await instance.post('/api/blocks', formDataB, {
      headers: { ...headers.headers, ...formDataB.getHeaders() },
    });

    const { data: bam } = await instance.get('/api/blocks');
    expect(bam).toMatchObject([omit(apple, ['files']), omit(pen, ['files'])]);
  });
});

describe('publishBlock', () => {
  it('should be possible to upload encoded file paths', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('version', '1.32.9');
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filename: encodeURIComponent('build/standing.png'), foo: 'bar' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: encodeURIComponent('build/testblock.js') },
    );

    const { data, status } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      actions: null,
      events: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      layout: null,
      resources: null,
      parameters: null,
      version: '1.32.9',
      description: null,
    });

    expect(status).toBe(201);
  });

  it('should not accept invalid action names', async () => {
    const formData = new FormData();
    formData.append('name', '@xkcd/standing');
    formData.append('actions', JSON.stringify({ $any: {}, $foo: {} }));
    formData.append('version', '1.32.9');
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );
    const response = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
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
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );

    await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const formData2 = new FormData();
    formData2.append('name', '@xkcd/standing');
    formData2.append(
      'description',
      'This block has been uploaded for the purpose of unit testing.',
    );
    formData2.append('version', '1.32.9');
    formData2.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData2.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );

    const { data } = await instance.post('/api/blocks', formData2, {
      headers: { ...headers.headers, ...formData2.getHeaders() },
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

    const { data, status } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
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
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );

    const { data: created } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const { data: retrieved, status } = await instance.get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );

    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
  });

  it('should respond with 404 when trying to fetch a non existing block version', async () => {
    const { data, status } = await instance.get('/api/blocks/@xkcd/standing/versions/3.1.4');
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
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'standing.png' },
    );
    formData.append(
      'files',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
      { filepath: 'testblock.js' },
    );
    await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const { data } = await instance.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      {
        name: '@xkcd/standing',
        description: 'Version 1.32.9!',
        actions: null,
        events: null,
        layout: null,
        parameters: null,
        resources: null,
        version: '1.32.9',
      },
    ]);
  });

  it('should not be possible to fetch block versions of non-existent blocks', async () => {
    const { data } = await instance.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block not found.',
    });
  });
});
