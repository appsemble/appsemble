import { type ActionCreator } from './index.js';

export const event: ActionCreator<'event'> = ({
  definition: { event: eventName, waitFor },
  ee,
  signal,
}) => [
  (data) => {
    // Once the owner of the chain is unmounted, emitting would update blocks of the currently
    // shown view with data from a dead one. The rest of the chain (e.g. resource writes) still
    // runs; only waiting for a response is pointless without the emission.
    if (signal?.aborted) {
      if (waitFor) {
        throw signal.reason;
      }
      return data;
    }
    ee.emit(eventName, data);
    if (!waitFor) {
      return data;
    }
    return new Promise((resolve, reject) => {
      const callback = (response: unknown, error: unknown): void => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      };
      ee.once(waitFor, callback);
      // Rejecting an already settled promise is a no-op, so the abort listener needs no cleanup
      // when the response event arrives first.
      signal?.addEventListener(
        'abort',
        () => {
          ee.off(waitFor, callback);
          reject(signal.reason);
        },
        { once: true },
      );
    });
  },
];
