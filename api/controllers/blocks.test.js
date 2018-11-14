import path from 'path';

import fs from 'fs-extra';
import request from 'supertest';

import koaServer from '../server';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';

describe('blocks', () => {
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema('blocks');

    server = await koaServer({ db });
  });

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
    expect(body).toStrictEqual({ name: '@xkcd/standing', version: '1.32.9' });
    expect(status).toBe(201);
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
    expect(body).toStrictEqual({ name: '@xkcd/standing', version: '1.32.9' });
    expect(status).toBe(201);
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
});
