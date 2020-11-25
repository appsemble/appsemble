import { EventEmitter } from 'events';

import { createEvents } from './events';

describe('createEvents', () => {
  let ee: EventEmitter;
  let promise: Promise<void>;
  let ready: () => Promise<void>;

  beforeEach(() => {
    ee = new EventEmitter();
    jest.spyOn(ee, 'emit');
    promise = new Promise((resolvePromise) => {
      // A tick is needed for the promise to actually be resolved. The simplest solution is to just
      // await ready. This is why it was made async.
      ready = () => {
        resolvePromise();
        return promise;
      };
    });
  });

  afterEach(() => {
    ee.removeAllListeners();
  });

  it('should emit events after the page is ready', async () => {
    const events = createEvents(ee, promise, { emit: { foo: {} } }, { emit: { foo: 'bar' } });
    const implemented = events.emit.foo('test', 'error');
    expect(ee.emit).not.toHaveBeenCalled();
    await ready();
    expect(await implemented).toBe(true);
    expect(ee.emit).toHaveBeenCalledWith('bar', 'test', 'error');
  });

  it('should not emit events if no emitters have been registered', async () => {
    const events = createEvents(ee, promise, { emit: { foo: {} } });
    const implemented = events.emit.foo('test', 'error');
    await ready();
    expect(await implemented).toBe(false);
    expect(ee.emit).not.toHaveBeenCalled();
  });

  it('should listen on events', () => {
    const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
    const listener = jest.fn();
    const implemented = events.on.foo(listener);
    ee.emit('bar', 'data');
    expect(implemented).toBe(true);
    expect(listener).toHaveBeenCalledWith('data');
  });

  it('should indicate if the event listener is implemented when registering', () => {
    const events = createEvents(ee, promise, { listen: { foo: {} } });
    const implemented = events.on.foo(() => {});
    expect(implemented).toBe(false);
  });

  it('should be possible to unregister event listeners', () => {
    const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
    const listener = jest.fn();
    events.on.foo(listener);
    const implemented = events.off.foo(listener);
    expect(implemented).toBe(true);
    ee.emit('bar', 'data');
    expect(listener).not.toHaveBeenCalled();
  });

  it('should indicate if the event listener is implemented when unregistering', () => {
    const events = createEvents(ee, promise, { listen: { foo: {} } });
    const implemented = events.off.foo(() => {});
    expect(implemented).toBe(false);
  });
});
