import { type EventEmitter } from 'node:events';

import {
  ActionError,
  type BlockDefinition,
  type ProjectManifest,
  remap,
  type Remapper,
} from '@appsemble/lang-sdk';
import {
  type BlockUtils,
  type BootstrapParams,
  type Events,
  type Messages,
  type Theme,
} from '@appsemble/sdk';
import { defaultLocale, has } from '@appsemble/utils';

export function remapWithContext(
  remapper: Remapper,
  data: any,
  context?: Record<string, any>,
): unknown {
  return remap(remapper, data, {
    // @ts-expect-error strictNullChecks not assignable to type
    getMessage: null,
    // @ts-expect-error strictNullChecks not assignable to type
    getVariable: null,
    appId: 1,
    url: 'https://example.com/en/example',
    appUrl: 'https://example.com',
    // @ts-expect-error strictNullChecks not assignable to type
    appMemberInfo: null,
    // @ts-expect-error strictNullChecks not assignable to type
    context,
    locale: defaultLocale,
  });
}

export function getDefaultUtils(): BlockUtils {
  return {
    showMessage(message) {
      return message;
    },
    formatMessage<T extends keyof Messages>(
      message: T,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...args: Messages[T] extends never ? [] : [Messages[T]]
    ) {
      return message;
    },
    asset(assetId) {
      return assetId;
    },
    fa(icon) {
      return icon;
    },
    // @ts-expect-error strictNullChecks not assignable to type
    remap: remapWithContext,
    isMobile: window.innerWidth < 768,
    menu() {
      return null;
    },
    isActionError(input): input is ActionError {
      return input instanceof ActionError;
    },
    addCleanup() {
      return null;
    },
  };
}

export function getDefaultBootstrapParams(): Pick<
  BootstrapParams,
  'data' | 'events' | 'path' | 'pathIndex' | 'shadowRoot' | 'theme' | 'utils'
> & { ready: () => Promise<void> } {
  return {
    data: {},
    path: '',
    pathIndex: '',
    shadowRoot: document?.createElement('div').attachShadow({ mode: 'open' }),
    theme: {} as Theme,
    utils: getDefaultUtils(),
    events: {
      // @ts-expect-error strictNullChecks not assignable to type
      emit: null,
      // @ts-expect-error strictNullChecks not assignable to type
      on: null,
      // @ts-expect-error strictNullChecks not assignable to type
      off: null,
    },
    ready() {
      return Promise.resolve();
    },
  };
}

/**
 * Create the events object that is passed to a block.
 *
 * FIXME This function is the same as @appsemble/app/utils/createEvents
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
): Events {
  function createProxy<
    E extends keyof Events,
    M extends keyof NonNullable<ProjectManifest['events']>,
  >(
    manifestKey: M,
    createFn: (registered: boolean, key: string) => Events[E][keyof Events[E]],
  ): Events[E] {
    return new Proxy<Events[E]>({} as Events[E], {
      get(target, key) {
        if (typeof key !== 'string') {
          return;
        }
        if (has(target, key)) {
          return target[key as keyof Events[E]];
        }
        if (!has(manifest?.[manifestKey], key) && !has(manifest?.[manifestKey], '$any')) {
          return;
        }
        const handler: Events[E][keyof Events[E]] = createFn(
          has(definition?.[manifestKey], key),
          key,
        );
        // eslint-disable-next-line no-param-reassign
        target[key as keyof Events[E]] = handler;
        return handler;
      },
    });
  }

  const emit = createProxy<'emit', 'emit'>('emit', (implemented, key) =>
    implemented
      ? async (data, error) => {
          await ready;
          const name = definition?.emit?.[key];
          // @ts-expect-error strictNullChecks not assignable to type
          ee.emit(name, data, error === '' ? 'Error' : error);
          return true;
        }
      : // eslint-disable-next-line require-await
        async () => false,
  );

  const on = createProxy<'on', 'listen'>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          // @ts-expect-error strictNullChecks not assignable to type
          ee.on(definition?.listen?.[key], callback);
          return true;
        }
      : () => false,
  );

  const off = createProxy<'off', 'listen'>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          // @ts-expect-error strictNullChecks not assignable to type
          ee.off(definition?.listen?.[key], callback);
          return true;
        }
      : () => false,
  );

  return { emit, on, off };
}
