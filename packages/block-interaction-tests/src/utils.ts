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
import { createIconElement, resolveIcon } from '@appsemble/web-utils';

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
    // Without a registry this resolves like an app without custom icons does.
    resolveIcon,
    icon(reference, options) {
      return createIconElement(resolveIcon(reference), options);
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
    isActionOwnerAbortError(input) {
      return (input as Error | null)?.name === 'ActionOwnerAbortError';
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

type EmitHandler = (data: unknown, error?: string) => Promise<boolean>;
type ListenHandler = <T>(callback: (data: T, error?: string) => void) => boolean;

/**
 * Create the events object that is passed to a block.
 *
 * The handler types are declared locally, because `Events` maps over `EventEmitters` and
 * `EventListeners`, which are empty for blocks that don't augment them.
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
    H extends EmitHandler | ListenHandler,
  >(manifestKey: M, createFn: (registered: boolean, key: string) => H): Events[E] {
    const handlers: Record<string, H> = {};
    return new Proxy<Events[E]>({} as Events[E], {
      get(target, key) {
        if (typeof key !== 'string') {
          return;
        }
        if (has(handlers, key)) {
          return handlers[key];
        }
        if (!has(manifest?.[manifestKey], key) && !has(manifest?.[manifestKey], '$any')) {
          return;
        }
        handlers[key] = createFn(has(definition?.[manifestKey], key), key);
        return handlers[key];
      },
    });
  }

  const emit = createProxy<'emit', 'emit', EmitHandler>('emit', (implemented, key) =>
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

  const on = createProxy<'on', 'listen', ListenHandler>('listen', (implemented, key) =>
    implemented
      ? (callback) => {
          // @ts-expect-error strictNullChecks not assignable to type
          ee.on(definition?.listen?.[key], callback);
          return true;
        }
      : () => false,
  );

  const off = createProxy<'off', 'listen', ListenHandler>('listen', (implemented, key) =>
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
