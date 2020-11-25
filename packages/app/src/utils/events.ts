import { EventEmitter } from 'events';

import { Events } from '@appsemble/sdk';
import { BlockDefinition, BlockManifest } from '@appsemble/types';

/**
 * Check if the target has an own property named after the key.
 *
 * @param target - The target that should have the key. Null values are also accepted.
 * @param key - The key to check for on the target.
 * @returns Whether or not the key exists on the target.
 */
function has(target: object, key: string): boolean {
  return target && Object.hasOwnProperty.call(target, key);
}

/**
 * Create the events object that is passed to a block.
 *
 * @param ee - The internal event emitter to use.
 * @param ready - A promise to wait for before emitting any events.
 * @param manifest - The block manifest.
 * @param definition - The block definition.
 * @returns An events object that may be passed into a block.
 */
export function createEvents(
  ee: EventEmitter,
  ready: Promise<void>,
  manifest?: BlockManifest['events'],
  definition?: BlockDefinition['events'],
): Events {
  const emit = new Proxy<Events['emit']>(
    {},
    {
      get(target, key) {
        if (typeof key !== 'string') {
          return;
        }
        if (has(target, key)) {
          return target[key];
        }
        if (!has(manifest?.emit, key) && !has(manifest?.emit, '$any')) {
          return;
        }
        const handler: Events['emit'][string] = has(definition?.emit, key)
          ? async (data, error) => {
              await ready;
              ee.emit(definition.emit[key], data, error === '' ? 'Error' : error);
              return true;
            }
          : // eslint-disable-next-line require-await
            async () => false;
        // eslint-disable-next-line no-param-reassign
        target[key] = handler;
        return handler;
      },
    },
  );

  const on = new Proxy<Events['on']>(
    {},
    {
      get(target, key) {
        if (typeof key !== 'string') {
          return;
        }
        if (has(target, key)) {
          return target[key];
        }
        if (!has(manifest?.listen, key) && !has(manifest?.listen, '$any')) {
          return;
        }
        const handler: Events['on'][string] = has(definition?.listen, key)
          ? (callback) => {
              ee.on(definition.listen[key], callback);
              return true;
            }
          : () => false;
        // eslint-disable-next-line no-param-reassign
        target[key] = handler;
        return handler;
      },
    },
  );

  const off = new Proxy<Events['on']>(
    {},
    {
      get(target, key) {
        if (typeof key !== 'string') {
          return;
        }
        if (has(target, key)) {
          return target[key];
        }
        if (!has(manifest?.listen, key) && !has(manifest?.listen, '$any')) {
          return;
        }
        const handler: Events['off'][string] = has(definition?.listen, key)
          ? (callback) => {
              ee.off(definition.listen[key], callback);
              return true;
            }
          : () => false;
        // eslint-disable-next-line no-param-reassign
        target[key] = handler;
        return handler;
      },
    },
  );

  return { emit, on, off };
}
