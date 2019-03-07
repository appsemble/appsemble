import path from 'path';

import fs from 'fs-extra';
import request from 'supertest';

import createServer from '../utils/createServer';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';

describe('blocks', () => {
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema('blocks');

    server = await createServer({ db });
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be possible to register a block definition', async () => {
    const { body } = await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      });
    expect(body).toStrictEqual({
      id: '@appsemble/test',
      description: 'This block has been uploaded for the purpose of unit testing.',
    });
  });

  it('should not be possible to register the same block definition twice', async () => {
    await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      });
    const { body } = await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      });
    expect(body).toStrictEqual({
      error: 'Conflict',
      message: 'Another block definition with id “@appsemble/test” already exists',
      statusCode: 409,
    });
  });

  it('should be possible to retrieve a block definition', async () => {
    const { body: original } = await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/test',
        description: 'This block has been uploaded for the purpose of unit testing.',
      });
    const { body: retrieved } = await request(server).get('/api/blocks/@appsemble/test');
    expect(retrieved).toStrictEqual(original);
  });

  it('should return a 404 if the requested block definition doesn’t exist', async () => {
    const { body } = await request(server).get('/api/blocks/@non/existent');
    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Block definition not found',
      statusCode: 404,
    });
  });

  it('should be possible to query block definitions', async () => {
    const { body: apple } = await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/apple',
        description: 'I’ve got an apple.',
      });
    const { body: pen } = await request(server)
      .post('/api/blocks')
      .send({
        id: '@appsemble/pen',
        description: 'I’ve got a pen.',
      });
    const { body: bam } = await request(server).get('/api/blocks');
    expect(bam).toStrictEqual([apple, pen]);
  });

  it('should be possible to upload block versions where data is sent as the first parameter', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    const { body, status } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .field('data', JSON.stringify({ version: '1.32.9' }))
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'));
    expect(body).toStrictEqual({
      actions: null,
      files: ['standing.png', 'testblock.js'],
      name: '@xkcd/standing',
      position: null,
      resources: null,
      version: '1.32.9',
    });
    expect(status).toBe(201);
  });

  it('should be possible to fetch uploaded block versions', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });

    await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'))
      .field('data', JSON.stringify({ version: '1.32.9' }));

    const { body } = await request(server).get('/api/blocks/@xkcd/standing/versions');
    expect(body).toStrictEqual([
      { actions: null, position: null, resources: null, version: '1.32.9' },
    ]);
  });

  it('should not be possible to fetch block versions of non-existent blocks', async () => {
    const { body } = await request(server).get('/api/blocks/@xkcd/standing/versions');
    expect(body).toStrictEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Block definition not found',
    });
  });

  it('should be possible to upload block versions where data is sent as the last parameter', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    const { body, status } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'))
      .field('data', JSON.stringify({ version: '1.32.9' }));
    expect(body).toStrictEqual({
      actions: null,
      files: ['standing.png', 'testblock.js'],
      name: '@xkcd/standing',
      position: null,
      resources: null,
      version: '1.32.9',
    });
    expect(status).toBe(201);
  });

  it('should not accept invalid form fields', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    const { body, status } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'))
      .field('invalid', '')
      .field('data', JSON.stringify({ version: '1.32.9' }));
    expect(body).toStrictEqual({
      error: 'Bad Request',
      message: 'Unexpected field: invalid',
      statusCode: 400,
    });
    expect(status).toBe(400);
  });

  it('should not be possible to register the same block version twice', async () => {
    await request(server)
      .post('/api/blocks')
      .send({
        id: '@xkcd/standing',
        description: 'This block has been uploaded for the purpose of unit testing.',
      });
    await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .field('data', JSON.stringify({ version: '1.32.9' }))
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'));
    const { body } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .field('data', JSON.stringify({ version: '1.32.9' }))
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'));
    expect(body).toStrictEqual({
      error: 'Conflict',
      message: 'Block version “@xkcd/standing@1.32.9” already exists',
      statusCode: 409,
    });
  });

  it('should require at least one file', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    const { body, status } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .field('data', JSON.stringify({ version: '1.32.9' }));
    expect(body).toStrictEqual({
      error: 'Bad Request',
      message: 'At least one file should be uploaded',
      statusCode: 400,
    });
    expect(status).toBe(400);
  });

  it('should be possible to retrieve block versions', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    const { body: created } = await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .attach('build/standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('build/testblock.js', path.join(__dirname, '__fixtures__/testblock.js'))
      .field('data', JSON.stringify({ version: '1.32.9' }));
    const { body: retrieved, status } = await request(server).get(
      '/api/blocks/@xkcd/standing/versions/1.32.9',
    );
    expect(retrieved).toStrictEqual(created);
    expect(status).toBe(200);
  });

  it('should respond with 404 when trying to fetch a non existing block version', async () => {
    const { body, status } = await request(server).get('/api/blocks/@xkcd/standing/versions/3.1.4');
    expect(status).toBe(404);
    expect(body).toStrictEqual({
      error: 'Not Found',
      message: 'Block version not found',
      statusCode: 404,
    });
  });

  it('should be possible to download block assets', async () => {
    await request(server)
      .post('/api/blocks')
      .send({ id: '@xkcd/standing' });
    await request(server)
      .post('/api/blocks/@xkcd/standing/versions')
      .attach('standing.png', path.join(__dirname, '__fixtures__/standing.png'))
      .attach('testblock.js', path.join(__dirname, '__fixtures__/testblock.js'))
      .field('data', JSON.stringify({ version: '1.32.9' }));
    const png = await request(server).get(
      '/api/blocks/@xkcd/standing/versions/1.32.9/standing.png',
    );
    expect(png.status).toBe(200);
    expect(png.type).toBe('image/png');
    expect(png.body).toStrictEqual(
      await fs.readFile(path.join(__dirname, '__fixtures__/standing.png')),
    );
    const js = await request(server).get('/api/blocks/@xkcd/standing/versions/1.32.9/testblock.js');
    expect(js.status).toBe(200);
    expect(js.type).toBe('application/javascript');
    expect(js.text).toStrictEqual(
      await fs.readFile(path.join(__dirname, '__fixtures__/testblock.js'), 'utf-8'),
    );
  });

  it('should respond with 404 when trying to fetch a non existing block asset', async () => {
    const { body, status } = await request(server).get(
      '/api/blocks/@xkcd/standing/versions/3.1.4/sitting.png',
    );
    expect(status).toBe(404);
    expect(body).toStrictEqual({});
  });
});
