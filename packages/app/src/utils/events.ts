import { EventEmitter } from 'events';

import { Events } from '@appsemble/sdk';
import { BlockDefinition, BlockManifest } from '@appsemble/types';
import { has } from '@appsemble/utils';
import { addBreadcrumb } from '@sentry/browser';

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
  function createProxy<E extends keyof Events, M extends keyof BlockManifest['events']>(
    manifestKey: M,
    createFn: (registered: boolean, key: string) => Events[E][string],
  ): Events[E] {
    return new Proxy<Events[E]>(
      {},
      {
        get(target, key) {
          if (typeof key !== 'string') {
            return;
          }
          if (has(target, key)) {
            return target[key];
          }
          if (!has(manifest?.[manifestKey], key) && !has(manifest?.[manifestKey], '$any')) {
            return;
          }
          const handler: Events[E][string] = createFn(has(definition?.[manifestKey], key), key);
          // eslint-disable-next-line no-param-reassign
          target[key as keyof Events[E]] = handler;
          return handler;
        },
      },
    );
  }

  const emit = createProxy<'emit', 'emit'>('emit', (implemented, key) =>
    implemented
      ? async (data, error) => {
          await ready;
          const name = definition.emit[key];
          ee.emit(name, data, error === '' ? 'Error' : error);
          addBreadcrumb({
            category: 'appsemble.event',
            data: { name, listeners: String(ee.listenerCount(name)) },
          });
          return true;
        }
      : // eslint-disable-next-line require-await
        async () => false,
  );

  const on = createProxy<'on', 'listen'>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          ee.on(definition.listen[key], callback);
          return true;
        }
      : () => false,
  );

  const off = createProxy<'off', 'listen'>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          ee.off(definition.listen[key], callback);
          return true;
        }
      : () => false,
  );

  return { emit, on, off };
}
