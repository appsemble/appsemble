import { EventEmitter } from 'events';

import { Events } from '@appsemble/sdk';
import { BlockDefinition, BlockManifest } from '@appsemble/types';
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
  const emit = Object.fromEntries(
    Object.keys(manifest?.emit || {}).map((key) => [
      key,
      (d: any, error?: string) =>
        ready.then(
          definition?.emit?.[key]
            ? () => {
                const name = definition.emit[key];
                ee.emit(name, d, error === '' ? 'Error' : error);
                addBreadcrumb({
                  category: 'appsemble.event',
                  data: { name, listeners: String(ee.listenerCount(name)) },
                });
                return true;
              }
            : () => false,
        ),
    ]),
  );

  const on = Object.fromEntries(
    Object.keys(manifest?.listen || {}).map((key) => [
      key,
      definition?.listen?.[key]
        ? (callback: (data: any, error?: string) => void) => {
            ee.on(definition.listen[key], callback);
            return true;
          }
        : () => false,
    ]),
  );

  const off = Object.fromEntries(
    Object.keys(manifest?.listen || {}).map((key) => [
      key,
      definition?.listen?.[key]
        ? (callback: (data: any, error?: string) => void) => {
            ee.off(definition.listen[key], callback);
            return true;
          }
        : () => false,
    ]),
  );

  return { emit, on, off };
}
