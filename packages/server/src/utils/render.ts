import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { resolve } from 'path';

import { compareStrings } from '@appsemble/utils';
import { render as renderTemplate } from 'mustache';

import { KoaContext } from '../types';

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

export type ContentSecurityPolicy = Record<string, (string | false)[]>;

/**
 * Convert a CSP key / values pair object into a real content security policy string.
 *
 * Any falsy values will be excluded.
 *
 * @param csp - The CSP object to convert
 * @returns The CSP object as a string
 */
export function makeCSP(csp: ContentSecurityPolicy): string {
  return Object.entries(csp)
    .map(([key, values]) => [key, values.filter(Boolean)] as const)
    .filter(([, values]) => values?.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => `${key} ${[...new Set(values)].sort(compareStrings).join(' ')}`)
    .join('; ');
}

export async function render(
  ctx: KoaContext,
  filename: string,
  data: Record<string, unknown>,
): Promise<void> {
  const template =
    process.env.NODE_ENV === 'production'
      ? await fs.readFile(resolve(__dirname, '..', '..', '..', '..', 'dist', filename), 'utf8')
      : ctx.state.fs.readFileSync(`/${filename}`, 'utf8');
  ctx.body = renderTemplate(template, data);
  ctx.type = 'html';
}
