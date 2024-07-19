import { type ContentSecurityPolicy, type GetCspParams } from '@appsemble/node-utils';

export function getCsp({ host, nonce, settingsHash }: GetCspParams): ContentSecurityPolicy {
  return {
    'connect-src': ['*', 'blob:', 'data:'],
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, settingsHash, "'unsafe-eval'"],
    'img-src': ['*', 'blob:', 'data:', host],
    'media-src': ['*', 'blob:', 'data:', host],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ['*', 'data:'],
    'frame-src': ["'self'", 'blob:', '*.vimeo.com', '*.youtube.com', '*.weseedo.nl'],
    'object-src': ["'self'", 'data:', 'blob:'],
  };
}
