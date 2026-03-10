import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

interface RequestContext {
  requestId: string;
  method: string;
  path: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestStore.getStore()?.requestId;
}

export function createRequestContext(method: string, path: string): RequestContext {
  return {
    requestId: randomUUID(),
    method,
    path,
  };
}
