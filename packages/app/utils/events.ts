import { type EventEmitter } from 'events';

import { type BlockDefinition } from '@appsemble/lang-sdk';
import { type Events } from '@appsemble/sdk';
import { type ProjectManifest } from '@appsemble/types';
import { has } from '@appsemble/utils';
import { addBreadcrumb } from '@sentry/browser';

/**
 * The events object passed to a block, extended with a `destroy` method for the app runtime.
 */
export interface DestroyableEvents extends Events {
  /**
   * Remove all listeners registered through this events object and disable it.
   *
   * After destruction `on` no longer registers listeners and `emit` no longer emits. This prevents
   * unmounted blocks from receiving or emitting events on the shared page event emitter.
   */
  destroy: () => void;
}

/**
 * Create the events object that is passed to a block.
 *
 * @param ee The internal event emitter to use.
 * @param ready A promise to wait for before emitting any events.
 * @param manifest The block manifest.
 * @param definition The block definition.
 * @returns An events object that may be passed into a block.
 */
export function createEvents(
  ee: EventEmitter,
  ready: Promise<void>,
  manifest?: ProjectManifest['events'],
  definition?: BlockDefinition['events'],
): DestroyableEvents {
  function createProxy<
    E extends keyof Events,
    M extends keyof NonNullable<ProjectManifest['events']>,
  >(manifestKey: M, createFn: (registered: boolean, key: string) => Events[E][string]): Events[E] {
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

  let destroyed = false;
  const registered: {
    callback: (...args: any[]) => void;
    listener: (...args: any[]) => void;
    name: string;
  }[] = [];

  function findRegisteredIndex(name: string, callback: (...args: any[]) => void): number {
    for (let index = registered.length - 1; index >= 0; index -= 1) {
      const registration = registered[index];
      if (registration.name === name && registration.callback === callback) {
        return index;
      }
    }
    return -1;
  }

  const emit = createProxy<'emit', 'emit'>('emit', (implemented, key) =>
    implemented
      ? async (data, error) => {
          await ready;
          if (destroyed) {
            return false;
          }
          const name = definition?.emit?.[key];
          // @ts-expect-error 2345 argument of type is not assignable to parameter of type
          // (strictNullChecks)
          ee.emit(name, data, error === '' ? 'Error' : error);
          addBreadcrumb({
            category: 'appsemble.event',
            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks)
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
          if (destroyed) {
            return false;
          }
          const name = definition?.listen?.[key];
          const listener = (...args: any[]): void => {
            (callback as (...listenerArgs: any[]) => void)(...args);
          };
          // @ts-expect-error 2345 argument of type is not assignable to parameter of type
          // (strictNullChecks)
          ee.on(name, listener);
          // @ts-expect-error 2345 argument of type is not assignable to parameter of type
          // (strictNullChecks)
          registered.push({ callback, listener, name });
          return true;
        }
      : () => false,
  );

  const off = createProxy<'off', 'listen'>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          const name = definition?.listen?.[key];
          const index = findRegisteredIndex(name!, callback);
          if (index !== -1) {
            const [registration] = registered.splice(index, 1);
            ee.off(registration.name, registration.listener);
          }
          return true;
        }
      : () => false,
  );

  const destroy = (): void => {
    destroyed = true;
    for (const { listener, name } of registered) {
      ee.off(name, listener);
    }
    registered.length = 0;
  };

  return { emit, on, off, destroy };
}
