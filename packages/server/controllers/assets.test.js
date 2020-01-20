import { createInstance } from 'axios-test-instance';

import createServer from '../utils/createServer';
import testSchema from '../utils/test/testSchema';
import truncate from '../utils/test/truncate';

describe('asset controller', () => {
  let Asset;
  let db;
  let request;
  let server;

  beforeAll(async () => {
    db = await testSchema('assets');

    server = await createServer({ db, argv: { host: window.location, secret: 'test' } });
    request = await createInstance(server);
    ({ Asset } = db.models);
  }, 10e3);

  beforeEach(async () => {
    await truncate(db);
  });

  afterAll(async () => {
    await request.close();
    await db.close();
  });

  it('should be able to fetch an asset', async () => {
    const data = Buffer.from('buffer');
    const asset = await Asset.create({
      mime: 'application/octet-stream',
      filename: 'test.bin',
      data,
    });
    const response = await request.get(`/api/assets/${asset.id}`, { responseType: 'arraybuffer' });

    expect(response).toMatchObject({
      status: 200,
      headers: expect.objectContaining({ 'content-type': 'application/octet-stream' }),
      data,
    });
  });

  it('should be able to create an asset', async () => {
    const data = Buffer.from([0xc0, 0xff, 0xee, 0xba, 0xbe]);

    const createResponse = await request.post('/api/assets', data, {
      headers: { 'content-type': 'application/octet-stream' },
    });
    expect(createResponse).toMatchObject({
      status: 201,
      data: { id: expect.any(Number) },
    });

    const getResponse = await request.get(`/api/assets/${createResponse.data.id}`, {
      responseType: 'arraybuffer',
    });
    expect(getResponse).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'application/octet-stream',
      },
      data,
    });
  });

  it('should accept empty files', async () => {
    const response = await request.post('/api/assets', Buffer.alloc(0));
    expect(response).toMatchObject({
      status: 201,
    });
  });
});
