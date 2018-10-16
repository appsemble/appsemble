import request from 'supertest';

import koaServer from '../server';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('asset controller', () => {
  let Asset;
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema();

    server = await koaServer({ db });
    ({ Asset } = db);
  });

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should be able to fetch an asset', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data,
    });
    const response = await request(server).get(`/api/assets/${asset.id}`);

    expect(response.type).toBe('application/octet-stream');
    expect(response.body).toEqual(data);
  });

  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const createResponse = await request(server)
      .post('/api/assets')
      .set('Content-Type', 'application/octet-stream')
      .send(data);

    const { id } = createResponse.body;

    expect(createResponse.status).toBe(201);
    expect(Number.isInteger(id)).toBeTruthy();

    const getResponse = await request(server).get(`/api/assets/${id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.type).toBe('application/octet-stream');
    expect(getResponse.body).toEqual(data);
  });

  it('should not accept empty files', async () => {
    const response = await request(server).post('/api/assets');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('No file found');
  });

  it('should fall back to application/octet-stream if no mime typpe is provided', async () => {
    const data = Buffer.from('test');
    const { id } = (await request(server)
      .post('/api/assets')
      .send(data)).body;
    const response = await request(server).get(`/api/assets/${id}`);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/octet-stream');
    expect(response.body.toString('utf8')).toBe('test');
  });
});
