import request from 'supertest';

import koaServer from '../server';
import truncate from '../utils/test/truncate';
import testSchema from '../utils/test/testSchema';

describe('blocks', () => {
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema();

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
});
