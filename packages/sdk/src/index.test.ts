import { attach, bootstrap } from '.';

let event: CustomEvent;
let originalCurrentScript: HTMLOrSVGScriptElement;

beforeEach(() => {
  originalCurrentScript = document.currentScript;
  Object.defineProperty(document, 'currentScript', {
    value: {
      dispatchEvent: jest.fn(e => {
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
  it('should dispatch the AppsembleBoostrap event', async () => {
    function fn(): void {}
    bootstrap(fn);
    expect(document.currentScript.dispatchEvent).toHaveBeenCalledWith(new CustomEvent(''));
    expect(event.type).toBe('AppsembleBootstrap');
    expect(event.detail).toStrictEqual({ fn, document });
  });
});

describe('attach', () => {
  it('should attach the returned value', async () => {
    const shadowRoot = {
      appendChild: jest.fn(),
    };
    const element = document.createElement('div');
    const fn = jest.fn(() => element);
    attach(fn);
    await event.detail.fn({ shadowRoot });
    expect(shadowRoot.appendChild).toHaveBeenCalledWith(element);
  });

  it('should attach an asynchronously returned value', async () => {
    const shadowRoot = {
      appendChild: jest.fn(),
    };
    const element = document.createElement('div');
    const fn = jest.fn(async () => element);
    attach(fn);
    await event.detail.fn({ shadowRoot });
    expect(shadowRoot.appendChild).toHaveBeenCalledWith(element);
  });

  it('should not attach a returned value if it’s not a DOM node', async () => {
    const shadowRoot = {
      appendChild: jest.fn(),
    };
    const fn = jest.fn(() => {});
    attach(fn);
    await event.detail.fn({ shadowRoot });
    expect(shadowRoot.appendChild).not.toHaveBeenCalled();
  });
});
