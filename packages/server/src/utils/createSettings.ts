import crypto from 'crypto';
import type { JsonObject } from 'type-fest';

export default function createSettings(settings: JsonObject): [string, string] {
  const script = `window.settings=${JSON.stringify(settings)}`;
  const hash = crypto.createHash('sha256').update(script, 'utf8').digest('base64');
  return [`'sha256-${hash}'`, `<script>${script}</script>`];
}
