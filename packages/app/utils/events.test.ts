import { EventEmitter } from 'events';

import { noop } from '@appsemble/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvents } from './events.js';

describe('createEvents', () => {
  let ee: EventEmitter;
  let promise: Promise<void>;
  let ready: () => Promise<void>;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/prefer-event-target
    ee = new EventEmitter();
    vi.spyOn(ee, 'emit');
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

  describe('emit', () => {
    it('should emit events after the page is ready', async () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } }, { emit: { foo: 'bar' } });
      const implemented = events.emit.foo('test', 'error');
      expect(ee.emit).not.toHaveBeenCalled();
      await ready();
      expect(await implemented).toBe(true);
      expect(ee.emit).toHaveBeenCalledWith('bar', 'test', 'error');
    });

    it('should handle empty string errors', async () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } }, { emit: { foo: 'bar' } });
      await ready();
      await events.emit.foo('test', '');
      expect(ee.emit).toHaveBeenCalledWith('bar', 'test', 'Error');
    });

    it('should not emit events if no emitters have been registered', async () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } });
      const implemented = events.emit.foo('test', 'error');
      await ready();
      expect(await implemented).toBe(false);
      expect(ee.emit).not.toHaveBeenCalled();
    });

    it('should cache the event emitter', () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } });
      expect(events.emit.foo).toBe(events.emit.foo);
    });

    it('should support emitting custom events', async () => {
      const events = createEvents(ee, promise, { emit: { $any: {} } }, { emit: { foo: 'bar' } });
      const implemented = events.emit.foo('test', 'error');
      expect(ee.emit).not.toHaveBeenCalled();
      await ready();
      expect(await implemented).toBe(true);
      expect(ee.emit).toHaveBeenCalledWith('bar', 'test', 'error');
    });

    it('should handle symbols', () => {
      const events = createEvents(ee, promise, { emit: { $any: {} } });
      // @ts-expect-error This type error is introduced for testing purposes.
      const emitter = events.emit[Symbol('test')];
      expect(emitter).toBeUndefined();
    });

    it('should handle unknown event types', () => {
      const events = createEvents(ee, promise, undefined, { emit: { foo: 'bar' } });
      const emitter = events.emit.foo;
      expect(emitter).toBeUndefined();
    });
  });

  describe('on', () => {
    it('should listen on events', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      const implemented = events.on.foo(listener);
      ee.emit('bar', 'data');
      expect(implemented).toBe(true);
      expect(listener).toHaveBeenCalledWith('data');
    });

    it('should indicate if the event listener is implemented when registering', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } });
      const implemented = events.on.foo(noop);
      expect(implemented).toBe(false);
    });

    it('should cache the event registration function', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } });
      expect(events.on.foo).toBe(events.on.foo);
    });

    it('should support registering custom events', () => {
      const events = createEvents(
        ee,
        promise,
        { listen: { $any: {} } },
        { listen: { foo: 'bar' } },
      );
      const listener = vi.fn();
      const implemented = events.on.foo(listener);
      ee.emit('bar', 'data');
      expect(implemented).toBe(true);
      expect(listener).toHaveBeenCalledWith('data');
    });

    it('should handle symbols', () => {
      const events = createEvents(ee, promise, { listen: { $any: {} } });
      // @ts-expect-error This type error is introduced for testing purposes.
      const emitter = events.on[Symbol('test')];
      expect(emitter).toBeUndefined();
    });

    it('should handle unknown event types', () => {
      const events = createEvents(ee, promise, undefined, { listen: { foo: 'bar' } });
      const emitter = events.on.foo;
      expect(emitter).toBeUndefined();
    });
  });

  describe('off', () => {
    it('should be possible to unregister event listeners', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.on.foo(listener);
      const implemented = events.off.foo(listener);
      expect(implemented).toBe(true);
      ee.emit('bar', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should indicate if the event listener is implemented when unregistering', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } });
      const implemented = events.off.foo(noop);
      expect(implemented).toBe(false);
    });

    it('should cache the event unregistration function', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } });
      expect(events.off.foo).toBe(events.off.foo);
    });

    it('should support unregistering custom events', () => {
      const events = createEvents(
        ee,
        promise,
        { listen: { $any: {} } },
        { listen: { foo: 'bar' } },
      );
      const listener = vi.fn();
      events.on.foo(listener);
      const implemented = events.off.foo(listener);
      expect(implemented).toBe(true);
      ee.emit('bar', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle symbols', () => {
      const events = createEvents(ee, promise, { listen: { $any: {} } });
      // @ts-expect-error This type error is introduced for testing purposes.
      const emitter = events.off[Symbol('test')];
      expect(emitter).toBeUndefined();
    });

    it('should handle unknown event types', () => {
      const events = createEvents(ee, promise, undefined, { listen: { foo: 'bar' } });
      const emitter = events.off.foo;
      expect(emitter).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should remove registered listeners from the event emitter', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.on.foo(listener);
      events.destroy();
      ee.emit('bar', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not remove listeners that were registered outside of the events object', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const external = vi.fn();
      ee.on('bar', external);
      events.on.foo(vi.fn());
      events.destroy();
      ee.emit('bar', 'data');
      expect(external).toHaveBeenCalledWith('data');
    });

    it('should not remove a later external listener that uses the same callback', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.on.foo(listener);
      ee.on('bar', listener);
      events.destroy();
      ee.emit('bar', 'data');
      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith('data');
    });

    it('should not track listeners that were unregistered before destroy', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.on.foo(listener);
      events.off.foo(listener);
      events.destroy();
      expect(ee.listenerCount('bar')).toBe(0);
    });

    it('should unregister one owned duplicate listener at a time', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.on.foo(listener);
      events.on.foo(listener);
      events.off.foo(listener);
      ee.emit('bar', 'data');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('should not register new listeners after destroy', () => {
      const events = createEvents(ee, promise, { listen: { foo: {} } }, { listen: { foo: 'bar' } });
      const listener = vi.fn();
      events.destroy();
      const implemented = events.on.foo(listener);
      expect(implemented).toBe(false);
      ee.emit('bar', 'data');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should not emit events after destroy', async () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } }, { emit: { foo: 'bar' } });
      await ready();
      events.destroy();
      const implemented = await events.emit.foo('test');
      expect(implemented).toBe(false);
      expect(ee.emit).not.toHaveBeenCalled();
    });

    it('should cancel emits that are still waiting for the page to be ready', async () => {
      const events = createEvents(ee, promise, { emit: { foo: {} } }, { emit: { foo: 'bar' } });
      const implemented = events.emit.foo('test');
      events.destroy();
      await ready();
      expect(await implemented).toBe(false);
      expect(ee.emit).not.toHaveBeenCalled();
    });
  });
});
