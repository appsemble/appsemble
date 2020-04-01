import { createInstance } from 'axios-test-instance';
import FormData from 'form-data';
import fs from 'fs-extra';
import { omit } from 'lodash';
import path from 'path';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

let db;
let server;
let instance;
let headers;
let user;
let clientToken;

beforeAll(async () => {
  db = await testSchema('blocks');

  server = await createServer({ db, argv: { host: 'http://localhost', secret: 'test' } });
}, 10e3);

beforeEach(async () => {
  await truncate(db);
  ({ clientToken, user } = await testToken(db, 'blocks:write'));
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

afterAll(async () => {
  await db.close();
});

describe('getBlock', () => {
  it('should be possible to retrieve a block definition', async () => {
    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({ name: '@xkcd/test', description: 'foo', version: '1.32.9' }),
    );
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
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
    formDataA.append(
      'data',
      JSON.stringify({
        name: '@xkcd/apple',
        version: '0.0.0',
        description: 'I’ve got an apple.',
      }),
    );
    formDataA.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );

    const { data: apple } = await instance.post('/api/blocks', formDataA, {
      headers: { ...headers.headers, ...formDataA.getHeaders() },
    });

    const formDataB = new FormData();
    formDataB.append(
      'data',
      JSON.stringify({
        name: '@xkcd/pen',
        version: '0.0.0',
        description: 'I’ve got a pen.',
      }),
    );
    formDataB.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );

    const { data: pen } = await instance.post('/api/blocks', formDataB, {
      headers: { ...headers.headers, ...formDataB.getHeaders() },
    });

    const { data: bam } = await instance.get('/api/blocks');
    expect(bam).toMatchObject([omit(apple, ['files']), omit(pen, ['files'])]);
  });
});

describe('publishBlock', () => {
  it('should be possible to upload block versions where data is sent as the first parameter', async () => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: '@xkcd/standing', version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
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
    formData.append(
      'data',
      JSON.stringify({
        name: '@xkcd/standing',
        actions: { $any: {}, $foo: {} },
        version: '1.32.9',
      }),
    );
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );
    const response = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(response).toMatchObject({
      status: 400,
      data: { message: 'Action “$foo” does match /^[a-z]\\w*$/' },
    });
  });

  it('should be possible to upload block versions where data is sent as the last parameter', async () => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: '@xkcd/standing', version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data, status } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      actions: null,
      events: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      parameters: null,
      layout: null,
      resources: null,
      version: '1.32.9',
      description: null,
    });
    expect(status).toBe(201);
  });

  it('should not be possible to register the same block version twice', async () => {
    const formData = new FormData();
    formData.append(
      'data',
      JSON.stringify({
        name: '@xkcd/standing',
        description: 'This block has been uploaded for the purpose of unit testing.',
        version: '1.32.9',
      }),
    );
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const formData2 = new FormData();
    formData2.append(
      'data',
      JSON.stringify({
        name: '@xkcd/standing',
        description: 'This block has been uploaded for the purpose of unit testing.',
        version: '1.32.9',
      }),
    );
    formData2.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData2.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data } = await instance.post('/api/blocks', formData2, {
      headers: { ...headers.headers, ...formData2.getHeaders() },
    });

    expect(data).toStrictEqual({
      error: 'Bad Request',
      message:
        'Version 1.32.9 is equal to or lower than the already existing @xkcd/standing@1.32.9.',
      statusCode: 400,
    });
  });

  it('should require at least one file', async () => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: '@xkcd/standing', version: '1.32.9' }));

    const { data, status } = await instance.post('/api/blocks', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      error: 'Bad Request',
      message: 'At least one file should be uploaded',
      statusCode: 400,
    });
    expect(status).toBe(400);
  });
});

describe('getBlockVersion', () => {
  it('should be possible to retrieve a block version', async () => {
    const formData = new FormData();
    formData.append('data', JSON.stringify({ name: '@xkcd/standing', version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
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
    formData.append(
      'data',
      JSON.stringify({ name: '@xkcd/standing', description: 'Version 1.32.9!', version: '1.32.9' }),
    );
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
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
