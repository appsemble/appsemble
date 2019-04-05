import request from 'supertest';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('asset controller', () => {
  let Asset;
  let db;
  let server;

  beforeAll(async () => {
    db = await testSchema('assets');

    server = await createServer({ db });
    ({ Asset } = db.models);
  }, 10e3);

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
    expect(response.body).toStrictEqual(data);
  });

  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);
    const createResponse = await request(server)
      .post('/api/assets')
      .set('Content-Type', 'application/octet-stream')
      .send(data);

    const { id } = createResponse.body;

    expect(createResponse.status).toBe(201);
    expect(id).toStrictEqual(expect.any(Number));

    const getResponse = await request(server).get(`/api/assets/${id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.type).toBe('application/octet-stream');
    expect(getResponse.body).toStrictEqual(data);
  });

  it('should accept empty files', async () => {
    const response = await request(server)
      .post('/api/assets')
      .send(Buffer.alloc(0));
    expect(response.status).toBe(201);
  });

  it('should fall back to application/octet-stream if no mime type is provided', async () => {
    const data = Buffer.from('test');
    const {
      body: { id },
    } = await request(server)
      .post('/api/assets')
      .send(data);

    const response = await request(server).get(`/api/assets/${id}`);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/octet-stream');
    expect(response.body.toString('utf8')).toBe('test');
  });
});
