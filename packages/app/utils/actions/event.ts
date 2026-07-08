import { type ActionCreator } from './index.js';

export const event: ActionCreator<'event'> = ({
  definition: { event: eventName, waitFor },
  ee,
  signal,
}) => [
  (data) => {
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
