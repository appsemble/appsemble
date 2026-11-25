import { describe, expect, it, vi } from 'vitest';

import {
  type SchemaRequestChainHandler,
  SchemaRequestChainOfResponsibility,
} from './SchemaRequestWrapper.js';
import { type Logger } from './Logger.js';

const logger = { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as Logger;

function handler(impl: (uri: string) => Promise<string | null>): SchemaRequestChainHandler {
  return { handle: vi.fn(impl) };
}

describe('SchemaRequestChainOfResponsibility', () => {
  it('returns the first handler that yields a schema and stops the chain', async () => {
    const miss = handler(() => Promise.resolve(null));
    const hit = handler(() => Promise.resolve('{"type":"object"}'));
    const never = handler(() => Promise.resolve('should not run'));
    const chain = new SchemaRequestChainOfResponsibility([miss, hit, never], logger);

    const result = await chain.handle('appsemble://schema.json');

    expect(result).toBe('{"type":"object"}');
    expect(never.handle).not.toHaveBeenCalled();
  });

  it('skips a handler that throws and continues down the chain', async () => {
    const boom = handler(() => Promise.reject(new Error('boom')));
    const hit = handler(() => Promise.resolve('{"type":"object"}'));
    const chain = new SchemaRequestChainOfResponsibility([boom, hit], logger);

    const result = await chain.handle('appsemble://schema.json');

    expect(result).toBe('{"type":"object"}');
  });

  it('returns an empty string when no handler yields a schema', async () => {
    const miss = handler(() => Promise.resolve(null));
    const chain = new SchemaRequestChainOfResponsibility([miss, miss], logger);

    const result = await chain.handle('appsemble://schema.json');

    expect(result).toBe('');
  });
});
