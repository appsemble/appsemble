import { randomUUID } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import { createRequestContext, getRequestId, requestStore } from './requestContext.js';

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    randomUUID: vi.fn(() => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
  };
});

describe('createRequestContext', () => {
  it('should create a context with requestId, method, and path', () => {
    const context = createRequestContext('GET', '/api/users');

    expect(context).toStrictEqual({
      requestId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      method: 'GET',
      path: '/api/users',
    });
  });

  it('should generate a new UUID for each context', () => {
    const mockedRandomUUID = vi.mocked(randomUUID);
    mockedRandomUUID.mockReturnValueOnce('11111111-2222-3333-4444-555555555555');
    mockedRandomUUID.mockReturnValueOnce('66666666-7777-8888-9999-aaaaaaaaaaaa');

    const context1 = createRequestContext('GET', '/first');
    const context2 = createRequestContext('POST', '/second');

    expect(context1.requestId).toBe('11111111-2222-3333-4444-555555555555');
    expect(context2.requestId).toBe('66666666-7777-8888-9999-aaaaaaaaaaaa');
  });
});

describe('getRequestId', () => {
  it('should return undefined outside of request context', () => {
    expect(getRequestId()).toBeUndefined();
  });

  it('should return the requestId when inside request context', () => {
    const context = createRequestContext('GET', '/test');

    requestStore.run(context, () => {
      expect(getRequestId()).toBe(context.requestId);
    });
  });

  it('should return undefined after exiting request context', () => {
    const context = createRequestContext('GET', '/test');

    requestStore.run(context, () => {
      expect(getRequestId()).toBe(context.requestId);
    });

    expect(getRequestId()).toBeUndefined();
  });
});

describe('requestStore', () => {
  it('should propagate context through async operations', async () => {
    const context = createRequestContext('POST', '/async');

    await requestStore.run(context, async () => {
      expect(getRequestId()).toBe(context.requestId);

      await Promise.resolve();
      expect(getRequestId()).toBe(context.requestId);

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      expect(getRequestId()).toBe(context.requestId);
    });
  });

  it('should isolate contexts between concurrent requests', async () => {
    const context1 = createRequestContext('GET', '/request1');
    const context2 = createRequestContext('GET', '/request2');

    const results: string[] = [];

    await Promise.all([
      requestStore.run(context1, async () => {
        results.push(`start1:${getRequestId()}`);
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
        results.push(`end1:${getRequestId()}`);
      }),
      requestStore.run(context2, async () => {
        results.push(`start2:${getRequestId()}`);
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        results.push(`end2:${getRequestId()}`);
      }),
    ]);

    expect(results).toContain(`start1:${context1.requestId}`);
    expect(results).toContain(`end1:${context1.requestId}`);
    expect(results).toContain(`start2:${context2.requestId}`);
    expect(results).toContain(`end2:${context2.requestId}`);
  });
});
