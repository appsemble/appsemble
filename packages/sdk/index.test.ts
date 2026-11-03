import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { bootstrap, controller, type ControllerFunction } from './index.js';

declare module './index.js' {
  interface Actions {
    read: never;
  }
}

let event: CustomEvent;
let originalCurrentScript: HTMLOrSVGScriptElement;

beforeEach(() => {
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  originalCurrentScript = document.currentScript;
  Object.defineProperty(document, 'currentScript', {
    value: {
      dispatchEvent: vi.fn((e) => {
        event = e;
      }),
    },
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(document, 'currentScript', {
    value: originalCurrentScript,
    writable: true,
  });
  // @ts-expect-error 2322 undefined is not assignable to type (strictNullChecks)
  originalCurrentScript = undefined;
});

describe('bootstrap', () => {
  it('should dispatch the AppsembleBootstrap event', () => {
    const fn = vi.fn();
    bootstrap(fn);
    expect(document.currentScript?.dispatchEvent).toHaveBeenCalledWith(new CustomEvent(''));
    expect(event.type).toBe('AppsembleBootstrap');
    expect(event.detail).toStrictEqual({ fn, document });
  });
});

describe('controller', () => {
  it('should expose handlers with names independent from configured actions', async () => {
    const fn = (({ actions }) => ({ view: () => actions.read() })) satisfies ControllerFunction;
    controller(fn);

    const handlers = event.detail.fn({ actions: { read: () => Promise.resolve('Saved lamp') } });

    expect(await handlers.view()).toBe('Saved lamp');
  });
});
