import { type Context } from 'koa';

import securitytxtDefaults from '../../assets/securitytxtDefaults.json' with { type: 'json' };

import { argv } from '../../utils/argv.js';

export function securitytxtHandler(ctx: Context): void {
  ctx.type = 'text/plain; charset=utf-8';
  ctx.body = [
    `Contact: mailto:${argv.securityEmail}`,
    `Expires: ${securitytxtDefaults.expires}`,
    `Canonical: ${ctx.URL.origin}${securitytxtDefaults.canonicalPath}`,
    `Policy: ${securitytxtDefaults.policy}`,
    `Preferred-Languages: ${securitytxtDefaults.preferredLanguages}`,
    '',
  ].join('\n');
}
