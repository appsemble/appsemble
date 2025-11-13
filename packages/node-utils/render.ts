import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { type ContentSecurityPolicy } from '@appsemble/node-utils';
import { compareStrings } from '@appsemble/utils';
import { type Context } from 'koa';
import mustache from 'mustache';

/**
 * Render settings as an HTML script tag.
 *
 * @param settings The settings to render. This must be a JSON serializable object.
 * @param nonce The settings nonce.
 * @param statements Custom JavaScript statements to append.
 * @returns A tuple of the digest and the HTML script tag. The digest should be added to the CSP
 *   `script-src`.
 */
export function createSettings(
  settings: unknown,
  nonce?: string,
  statements: string[] = [],
): [digest: string, script: string] {
  const script = [`window.settings=${JSON.stringify(settings)}`, ...statements].join(';');
  const hash = createHash('sha256').update(script, 'utf8').digest('base64');
  return [
    `'sha256-${hash}'`,
    nonce ? `<script nonce="${nonce}">${script}</script>` : `<script>${script}</script>`,
  ];
}

export async function render(
  ctx: Context,
  filename: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    ctx.body = JSON.stringify({ filename, data });
  } else {
    const template = await (process.env.NODE_ENV === 'production'
      ? readFile(new URL(`../../dist/${filename}`, import.meta.url), 'utf8')
      : ctx.fs.promises.readFile(`/${filename}`, 'utf8'));
    ctx.body = mustache.render(template, data);
  }
  ctx.type = 'html';
}

/**
 * Convert a CSP key / values pair object into a real content security policy string.
 *
 * Any falsy values will be excluded.
 *
 * @param csp The CSP object to convert
 * @returns The CSP object as a string
 */
export function makeCSP(csp: ContentSecurityPolicy): string {
  return Object.entries(csp)
    .map(([key, values]) => [key, values.filter((val) => val !== false && val != null)] as const)
    .filter(([, values]) => values?.length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => `${key} ${[...new Set(values)].sort(compareStrings).join(' ')}`)
    .join('; ');
}
