import { bootstrap } from './index.js';

let event: CustomEvent;
let originalCurrentScript: HTMLOrSVGScriptElement;

beforeEach(() => {
  originalCurrentScript = document.currentScript;
  Object.defineProperty(document, 'currentScript', {
    value: {
      dispatchEvent: jest.fn((e) => {
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
  originalCurrentScript = undefined;
});

describe('bootstrap', () => {
  it('should dispatch the AppsembleBoostrap event', () => {
    const fn = jest.fn();
    bootstrap(fn);
    expect(document.currentScript.dispatchEvent).toHaveBeenCalledWith(new CustomEvent(''));
    expect(event.type).toBe('AppsembleBootstrap');
    expect(event.detail).toStrictEqual({ fn, document });
  });
});
