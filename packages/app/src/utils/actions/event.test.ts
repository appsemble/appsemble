import { EventEmitter } from 'events';

import { event } from './event';

describe('event', () => {
  let ee: EventEmitter;

  beforeEach(() => {
    ee = new EventEmitter();
    jest.spyOn(ee, 'once');
  });

  afterEach(() => {
    ee.removeAllListeners();
  });

  it('should return the input data', async () => {
    const action = event({
      ee,
      definition: {
        type: 'event',
        event: 'foo',
      },
    });
    const result = await action.dispatch({ test: 'data' });
    expect(result).toStrictEqual({ test: 'data' });
    expect(ee.once).not.toHaveBeenCalled();
  });

  it('should wait for a response event if waitFor is defined', async () => {
    const action = event({
      ee,
      definition: {
        type: 'event',
        event: 'foo',
        waitFor: 'bar',
      },
    });
    const result = action.dispatch();
    ee.emit('bar', { test: 'data' });
    expect(await result).toStrictEqual({ test: 'data' });
    expect(ee.once).toHaveBeenCalledTimes(1);
  });

  it('should reject of a response event emits an error', async () => {
    const action = event({
      ee,
      definition: {
        type: 'event',
        event: 'foo',
        waitFor: 'bar',
      },
    });
    const result = action.dispatch();
    ee.emit('bar', { test: 'data' }, 'Boo!');
    await expect(result).rejects.toBe('Boo!');
    expect(ee.once).toHaveBeenCalledTimes(1);
  });
});
