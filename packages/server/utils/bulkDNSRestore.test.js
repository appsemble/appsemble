import bulkDNSRestore from './bulkDNSRestore';
import testSchema from './test/testSchema';

let db;
let dnsConfig;

beforeEach(async () => {
  db = await testSchema('bulkDNSRestore');
  dnsConfig = {
    add: jest.fn(),
  };
  await db.models.Organization.create({ id: 'test' });
});

afterEach(async () => {
  await db.close();
});

it('should add DNS settings for all apps', async () => {
  await Promise.all(
    Array.from(Array(7), async (_, index) => {
      await db.models.App.create({
        domain: `app${index}.example.com`,
        path: `path${index}`,
        definition: {},
        vapidPublicKey: 'a',
        vapidPrivateKey: 'b',
        OrganizationId: 'test',
      });
    }),
  );
  await bulkDNSRestore('localhost', db, dnsConfig, 2);
  expect(dnsConfig.add).toHaveBeenCalledTimes(4);
  expect(dnsConfig.add).toHaveBeenNthCalledWith(
    1,
    'app0.example.com',
    'path0.test.localhost',
    'app1.example.com',
    'path1.test.localhost',
  );
  expect(dnsConfig.add).toHaveBeenNthCalledWith(
    2,
    'app2.example.com',
    'path2.test.localhost',
    'app3.example.com',
    'path3.test.localhost',
  );
  expect(dnsConfig.add).toHaveBeenNthCalledWith(
    3,
    'app4.example.com',
    'path4.test.localhost',
    'app5.example.com',
    'path5.test.localhost',
  );
  expect(dnsConfig.add).toHaveBeenNthCalledWith(4, 'app6.example.com', 'path6.test.localhost');
});

it('should skip the last bulk of apps if it is empty', async () => {
  await Promise.all(
    Array.from(Array(4), async (_, index) => {
      await db.models.App.create({
        domain: `app${index}.example.com`,
        path: `path${index}`,
        definition: {},
        vapidPublicKey: `a${index}`,
        vapidPrivateKey: `b${index}`,
        OrganizationId: 'test',
      });
    }),
  );
  await bulkDNSRestore('localhost', db, dnsConfig, 2);
  expect(dnsConfig.add).toHaveBeenCalledTimes(2);
  expect(dnsConfig.add).toHaveBeenNthCalledWith(
    1,
    'app0.example.com',
    'path0.test.localhost',
    'app1.example.com',
    'path1.test.localhost',
  );
  expect(dnsConfig.add).toHaveBeenNthCalledWith(
    2,
    'app2.example.com',
    'path2.test.localhost',
    'app3.example.com',
    'path3.test.localhost',
  );
});
