import { type EventParams } from '@appsemble/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let originalCurrentScript: HTMLOrSVGScriptElement | null;
let script: HTMLScriptElement;
const { settings } = window;

beforeEach(() => {
  vi.resetModules();
  window.settings = { ...settings, appControllerCode: 'controller fixture' };
  script = document.createElement('script');
  script.id = 'app-controller';
  document.head.append(script);
  originalCurrentScript = document.currentScript;
  Object.defineProperty(document, 'currentScript', { configurable: true, value: script });
});

afterEach(() => {
  script.remove();
  window.settings = settings;
  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    value: originalCurrentScript,
  });
});

describe('controller', () => {
  it('should run an initial page action after its controller finishes loading', async () => {
    const { controller: registerController } = await import('@appsemble/sdk');
    const { callController } = await import('../bootstrapper.js');
    const { createTestAction } = await import('../makeActions.js');
    const view = createTestAction({ definition: { type: 'controller', handler: 'view' } });

    const result = view({ selected: 'Nursery' });
    const initializing = callController({} as EventParams);
    registerController(() => ({ view: (data) => ({ lamp: data.selected }) }));

    await initializing;
    expect(await result).toStrictEqual({ lamp: 'Nursery' });
  });

  it('should use the active page controller after asynchronous initialization', async () => {
    const { controller: registerController } = await import('@appsemble/sdk');
    const { callController } = await import('../bootstrapper.js');
    const { createTestAction } = await import('../makeActions.js');
    const view = createTestAction({ definition: { type: 'controller', handler: 'view' } });
    const initializing = callController({ data: 'My lamps' } as EventParams);
    registerController(async ({ data }) => {
      await Promise.resolve();
      return { view: () => data };
    });
    await initializing;
    expect(await view()).toBe('My lamps');

    const nextPage = callController({ data: 'Lamp settings' } as EventParams);
    const result = view();

    await nextPage;
    expect(await result).toBe('Lamp settings');
  });
});
