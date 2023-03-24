import { ContentSecurityPolicy, GetCspParams } from '@appsemble/node-utils/types';

export const getCsp = ({ host, nonce, settingsHash }: GetCspParams): ContentSecurityPolicy => ({
  'connect-src': ['*', 'blob:', 'data:'],
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    `'nonce-${nonce}'`,
    settingsHash,
    // This is needed for Webpack.
    process.env.NODE_ENV !== 'production' && "'unsafe-eval'",
  ],
  'img-src': ['*', 'blob:', 'data:', host],
  'media-src': ['*', 'blob:', 'data:', host],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ['*', 'data:'],
  'frame-src': ["'self'", '*.vimeo.com', '*.youtube.com'],
});
