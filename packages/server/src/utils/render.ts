import { createHash } from 'crypto';

/**
 * Render settings as an HTML script tag.
 *
 * @param settings - The settings to render. This must be a JSON serializable object.
 * @returns A tuple of the digest and the HTML script tag. The digest should be added to the CSP
 * `script-src`.
 */
export function createSettings(settings: unknown): [digest: string, script: string] {
  const script = `window.settings=${JSON.stringify(settings)}`;
  const hash = createHash('sha256').update(script, 'utf8').digest('base64');
  return [`'sha256-${hash}'`, `<script>${script}</script>`];
}
