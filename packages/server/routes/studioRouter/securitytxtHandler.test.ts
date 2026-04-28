import { request, setTestApp } from 'axios-test-instance';
import Koa from 'koa';
import { beforeAll, describe, expect, it } from 'vitest';

import { studioRouter } from './index.js';
import securitytxtDefaults from '../../assets/securitytxtDefaults.json' with { type: 'json' };
import { setArgv } from '../../index.js';

describe('securityTxtHandler', () => {
  beforeAll(async () => {
    await setTestApp(
      new Koa()
        .use((ctx, next) => {
          Object.defineProperty(ctx, 'URL', { value: new URL('http://studio.localhost') });
          return next();
        })
        .use(studioRouter),
    );
  });

  it('should serve security.txt with dynamic email and required fields', async () => {
    setArgv({ securityEmail: 'team-security@example.com' });
    const response = await request.get('/.well-known/security.txt');

    expect(response).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
      data: [
        'Contact: mailto:team-security@example.com',
        `Expires: ${securitytxtDefaults.expires}`,
        `Canonical: http://studio.localhost${securitytxtDefaults.canonicalPath}`,
        `Policy: ${securitytxtDefaults.policy}`,
        `Preferred-Languages: ${securitytxtDefaults.preferredLanguages}`,
        '',
      ].join('\n'),
    });
  });
});
