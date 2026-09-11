import { beforeEach, describe, expect, it, vi } from 'vitest';

const valkeyMock = vi.hoisted(() => ({
  getValkeyClient: vi.fn(),
}));

vi.mock('./valkey.js', () => valkeyMock);

const { ServerJsonCache } = await import('./serverCache.js');

function createValkeyClient(): {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
} {
  const store = new Map<string, string>();
  return {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK');
    }),
  };
}

describe('ServerJsonCache', () => {
  beforeEach(() => {
    valkeyMock.getValkeyClient.mockReset();
  });

  it('is disabled without Valkey configuration', async () => {
    const cache = new ServerJsonCache(() => ({ prefix: 'test', ttl: 300 }));

    expect(await cache.get('key')).toStrictEqual({ status: 'disabled' });
    expect(await cache.set('key', { value: true })).toBe('disabled');
  });

  it('is disabled when the TTL is 0', async () => {
    valkeyMock.getValkeyClient.mockReturnValue(createValkeyClient());
    const cache = new ServerJsonCache(() => ({ prefix: 'test', ttl: 0 }));

    expect(await cache.get('key')).toStrictEqual({ status: 'disabled' });
    expect(await cache.set('key', { value: true })).toBe('disabled');
  });

  it('round-trips typed JSON values', async () => {
    const client = createValkeyClient();
    valkeyMock.getValkeyClient.mockReturnValue(client);
    const cache = new ServerJsonCache(() => ({
      prefix: 'test',
      ttl: 42,
    }));

    expect(await cache.get<{ value: boolean }>('key')).toStrictEqual({
      status: 'miss',
    });
    expect(await cache.set('key', { value: true })).toBe('miss');
    expect(await cache.get<{ value: boolean }>('key')).toStrictEqual({
      status: 'hit',
      value: { value: true },
    });
    expect(client.set).toHaveBeenCalledWith('test:key', '{"value":true}', 'EX', 42);
  });

  it('falls back to errors without throwing', async () => {
    const client = createValkeyClient();
    client.get.mockRejectedValue(new Error('unavailable'));
    client.set.mockRejectedValue(new Error('unavailable'));
    valkeyMock.getValkeyClient.mockReturnValue(client);
    const cache = new ServerJsonCache(() => ({
      prefix: 'test',
      ttl: 300,
    }));

    expect(await cache.get('key')).toStrictEqual({ status: 'error' });
    expect(await cache.set('key', { value: true })).toBe('error');
  });
});
