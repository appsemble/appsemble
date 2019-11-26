import { createInstance } from 'axios-test-instance';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import testToken from '../utils/test/testToken';
import truncate from '../utils/test/truncate';

describe('blocks', () => {
  let db;
  let server;
  let token;
  let instance;
  let headers;

  beforeAll(async () => {
    db = await testSchema('blocks');

    server = await createServer({ db });
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
    token = await testToken(server, db, 'blocks:write');
    headers = { headers: { Authorization: token } };
    instance = await createInstance(server);
  });

  afterEach(async () => {
    await instance.close();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be possible to register a block definition', async () => {
    const { data } = await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      },
      headers,
    );

    expect(data).toStrictEqual({
      id: '@appsemble/test',
      description: 'This block has been uploaded for the purpose of unit testing.',
    });
  });

  it('should not be possible to register the same block definition twice', async () => {
    await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      },
      headers,
    );

    const { data } = await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      },
      headers,
    );

    expect(data).toStrictEqual({
      error: 'Conflict',
      message: 'Another block definition with id “@appsemble/test” already exists',
      statusCode: 409,
    });
  });

  it('should be possible to retrieve a block definition', async () => {
    const { data: original } = await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      },
      headers,
    );

    const { data: retrieved } = await instance.get('/api/blocks/@appsemble/test');
    expect(retrieved).toStrictEqual(original);
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { data } = await instance.get('/api/blocks/@non/existent');
    expect(data).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });

  it('should be possible to query block definitions', async () => {
    const { data: apple } = await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/apple',
        description: 'I’ve got an apple.',
      },
      headers,
    );

    const { data: pen } = await instance.post(
      '/api/blocks',
      {
        id: '@appsemble/pen',
        description: 'I’ve got a pen.',
      },
      headers,
    );

    const { data: bam } = await instance.get('/api/blocks');
    expect(bam).toStrictEqual([apple, pen]);
  });

  it('should be possible to upload block versions where data is sent as the first parameter', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data, status } = await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      actions: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      layout: null,
      resources: null,
      parameters: null,
      version: '1.32.9',
    });

    expect(status).toBe(201);
  });

  it('should be possible to fetch uploaded block versions', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );
    await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const { data } = await instance.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual([
      { actions: null, layout: null, resources: null, version: '1.32.9' },
    ]);
  });

  it('should not be possible to fetch block versions of non-existent blocks', async () => {
    const { data } = await instance.get('/api/blocks/@xkcd/standing/versions');
    expect(data).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block definition not found',
    });
  });

  it('should be possible to upload block versions where data is sent as the last parameter', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data, status } = await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      actions: null,
      files: ['build/standing.png', 'build/testblock.js'],
      name: '@xkcd/standing',
      parameters: null,
      layout: null,
      resources: null,
      version: '1.32.9',
    });
    expect(status).toBe(201);
  });

  it('should not be possible to register the same block version twice', async () => {
    await instance.post(
      '/api/blocks',
      {
        id: '@xkcd/standing',
        description: 'This block has been uploaded for the purpose of unit testing.',
      },
      headers,
    );

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    const formData2 = new FormData();
    formData2.append('data', JSON.stringify({ version: '1.32.9' }));
    formData2.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData2.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data } = await instance.post('/api/blocks/@xkcd/standing/versions', formData2, {
      headers: { ...headers.headers, ...formData2.getHeaders() },
    });

    expect(data).toStrictEqual({
      error: 'Conflict',
      message: 'Block version “@xkcd/standing@1.32.9” already exists',
      statusCode: 409,
    });
  });

  it('should require at least one file', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);
    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));

    const { data, status } = await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });

    expect(data).toStrictEqual({
      error: 'Bad Request',
      message: 'At least one file should be uploaded',
      statusCode: 400,
    });
    expect(status).toBe(400);
  });

  it('should be possible to retrieve block versions', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'build/standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'build/testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    const { data: created } = await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
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

  it('should be possible to download block assets', async () => {
    await instance.post('/api/blocks', { id: '@xkcd/standing' }, headers);

    const formData = new FormData();
    formData.append('data', JSON.stringify({ version: '1.32.9' }));
    formData.append(
      'standing.png',
      fs.createReadStream(path.join(__dirname, '__fixtures__/standing.png')),
    );
    formData.append(
      'testblock.js',
      fs.createReadStream(path.join(__dirname, '__fixtures__/testblock.js')),
    );

    await instance.post('/api/blocks/@xkcd/standing/versions', formData, {
      headers: { ...headers.headers, ...formData.getHeaders() },
    });
    const png = await instance.get('/api/blocks/@xkcd/standing/versions/1.32.9/standing.png', {
      responseType: 'arraybuffer',
    });
    expect(png.status).toBe(200);
    expect(png.headers['content-type']).toBe('image/png');
    expect(png.data).toStrictEqual(
      await fs.readFile(path.join(__dirname, '__fixtures__/standing.png')),
    );
    const js = await instance.get('/api/blocks/@xkcd/standing/versions/1.32.9/testblock.js');
    expect(js.status).toBe(200);
    expect(js.headers['content-type']).toBe('application/javascript; charset=utf-8');
    expect(js.data).toStrictEqual(
      await fs.readFile(path.join(__dirname, '__fixtures__/testblock.js'), 'utf-8'),
    );
  });

  it('should respond with 404 when trying to fetch a non existing block asset', async () => {
    const { status } = await instance.get('/api/blocks/@xkcd/standing/versions/3.1.4/sitting.png');
    expect(status).toBe(404);
  });
});
