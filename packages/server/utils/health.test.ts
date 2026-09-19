import { noop } from '@appsemble/utils';
import { ConnectionRefusedError } from 'sequelize';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getReadiness } from './health.js';
import { getDB } from '../models/index.js';

// The readiness result is cached per process. Every test starts a minute after the previous one,
// so it always begins with an expired cache.
let now = Date.now();

describe('getReadiness', () => {
  beforeEach(() => {
    now += 60_000;
    vi.useFakeTimers({ now });
  });

  it('should report the database as up', async () => {
    expect(await getReadiness()).toStrictEqual({
      status: 'UP',
      checks: [{ name: 'database', status: 'UP', data: { detail: 'ok' } }],
    });
  });

  it('should share one database query between concurrent calls', async () => {
    const authenticate = vi.spyOn(getDB(), 'authenticate');

    const results = await Promise.all([getReadiness(), getReadiness(), getReadiness()]);

    expect(results.map(({ status }) => status)).toStrictEqual(['UP', 'UP', 'UP']);
    expect(authenticate).toHaveBeenCalledTimes(1);
  });

  it('should query the database at most once per cache lifetime', async () => {
    const authenticate = vi.spyOn(getDB(), 'authenticate');

    await getReadiness();
    vi.advanceTimersByTime(5000);
    await getReadiness();
    expect(authenticate).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6000);
    await getReadiness();
    expect(authenticate).toHaveBeenCalledTimes(2);
  });

  it('should report the database as down without exposing the error message', async () => {
    vi.spyOn(getDB(), 'authenticate').mockRejectedValue(
      new ConnectionRefusedError(new Error('connect ECONNREFUSED db.internal:5432')),
    );

    expect(await getReadiness()).toStrictEqual({
      status: 'DOWN',
      checks: [
        { name: 'database', status: 'DOWN', data: { detail: 'SequelizeConnectionRefusedError' } },
      ],
    });
  });

  it('should report the database as down when it does not answer in time', async () => {
    vi.spyOn(getDB().connectionManager, 'getConnection').mockReturnValue(new Promise(noop));

    const readiness = getReadiness();
    await vi.advanceTimersByTimeAsync(2000);

    expect(await readiness).toStrictEqual({
      status: 'DOWN',
      checks: [{ name: 'database', status: 'DOWN', data: { detail: 'TimeoutError' } }],
    });
  });
});
