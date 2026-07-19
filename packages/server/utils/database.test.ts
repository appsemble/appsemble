import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDirectPostgresConnection, iterTable } from './database.js';
import { User } from '../models/index.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getDirectPostgresConnection', () => {
  it('should preserve the configured database endpoint without a direct endpoint', () => {
    vi.stubEnv('DATABASE_DIRECT_HOST', '');

    expect(
      getDirectPostgresConnection({ dbHost: 'database.example.com', dbPort: 6432 }),
    ).toStrictEqual({ dbHost: 'database.example.com', dbPort: 6432 });
  });

  it('should return the direct database endpoint', () => {
    vi.stubEnv('DATABASE_DIRECT_HOST', 'postgres.example.com');
    vi.stubEnv('DATABASE_DIRECT_PORT', '5432');

    expect(
      getDirectPostgresConnection({ dbHost: 'pgbouncer.example.com', dbPort: 6432 }),
    ).toStrictEqual({ dbHost: 'postgres.example.com', dbPort: 5432 });
  });

  it.each([undefined, '0', '1.5', '65536', 'invalid'])(
    'should reject invalid direct database port %s',
    (directPort) => {
      vi.stubEnv('DATABASE_DIRECT_HOST', 'postgres.example.com');
      vi.stubEnv('DATABASE_DIRECT_PORT', directPort);

      expect(() =>
        getDirectPostgresConnection({ dbHost: 'pgbouncer.example.com', dbPort: 6432 }),
      ).toThrow('DATABASE_DIRECT_PORT must be a valid port when DATABASE_DIRECT_HOST is set.');
    },
  );
});

describe('iterTable', () => {
  it('should iterate if the length is not divisible by chunk size', async () => {
    vi.spyOn(User, 'findAll');
    const created = await User.bulkCreate(
      Array.from({ length: 5 }, () => ({ timezone: 'Europe/Amsterdam' })),
    );
    const retrieved: User[] = [];
    // This should fetch fhe following chunks:
    // [{ id: 0}, { id: 1 }]
    // [{ id: 2}, { id: 3 }]
    // [{ id: 4}]
    // Because the chunk size is 2
    for await (const user of iterTable(User, { chunkSize: 2, raw: true })) {
      retrieved.push(user);
    }
    // Causing findAll to have been called thrice
    expect(User.findAll).toHaveBeenCalledTimes(3);
    expect(User.findAll).toHaveBeenCalledWith({ limit: 2, offset: 0, raw: true });
    expect(User.findAll).toHaveBeenCalledWith({ limit: 2, offset: 2, raw: true });
    expect(User.findAll).toHaveBeenLastCalledWith({ limit: 2, offset: 4, raw: true });
    // Raw values are needed for comparison
    expect(created.map((user) => user.toJSON())).toStrictEqual(retrieved);
  });

  it('should iterate if the length is divisible by chunk size', async () => {
    vi.spyOn(User, 'findAll');
    const created = await User.bulkCreate(
      Array.from({ length: 6 }, () => ({ timezone: 'Europe/Amsterdam' })),
    );
    const retrieved: User[] = [];
    // This should fetch fhe following chunks:
    // [{ id: 0}, { id: 1 }]
    // [{ id: 2}, { id: 3 }]
    // [{ id: 4}, { id: 5 }]
    // []
    // The last query is needed, because it can’t tell from the second last it should be the last
    // one.
    for await (const user of iterTable(User, { chunkSize: 2, raw: true })) {
      retrieved.push(user);
    }
    // Causing findAll to have been called thrice
    expect(User.findAll).toHaveBeenCalledTimes(4);
    // Raw values are needed for comparison
    expect(created.map((user) => user.toJSON())).toStrictEqual(retrieved);
  });
});
