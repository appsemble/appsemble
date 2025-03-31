import { type ActionCreator } from './index.js';

export const analytics: ActionCreator<'analytics'> = ({
  definition: { config, target },
  remap,
}) => [
  (data) => {
    try {
      gtag('event', target, remap(config ?? null, data));
    } catch {
      // Explicitly ignore any errors that occur when doing analytics.
    }
    return data;
  },
];
