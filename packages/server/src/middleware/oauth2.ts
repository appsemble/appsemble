import Grant from 'grant';
import { URL } from 'url';

import type { Argv, KoaMiddleware } from '../types';

export default function oauth2(argv: Argv): KoaMiddleware {
  const { host, protocol } = new URL(argv.host);

  return Grant.koa()({
    server: {
      // URL.protocol leaves a ´:´ in.
      protocol: protocol.replace(':', ''),
      host,
    },
    ...(argv.oauthGitlabKey && {
      gitlab: {
        key: argv.oauthGitlabKey,
        secret: argv.oauthGitlabSecret,
        scope: ['email openid profile'],
        state: true,
      },
    }),
    ...(argv.oauthGoogleKey && {
      google: {
        key: argv.oauthGoogleKey,
        secret: argv.oauthGoogleSecret,
        scope: ['email openid profile'],
        custom_params: { access_type: 'offline' },
      },
    }),
  });
}
