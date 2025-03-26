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
});
