import { createHash } from 'crypto';

export function createSettings(settings: unknown): [string, string] {
  const script = `window.settings=${JSON.stringify(settings)}`;
  const hash = createHash('sha256').update(script, 'utf8').digest('base64');
  return [`'sha256-${hash}'`, `<script>${script}</script>`];
}
