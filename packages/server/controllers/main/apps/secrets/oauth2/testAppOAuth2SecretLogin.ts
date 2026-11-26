import { AppsembleError, getSSRFProtectedAgents } from '@appsemble/node-utils';
import { type AppOAuth2SecretLoginTest, type TokenResponse } from '@appsemble/types';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { type Context } from 'koa';

import {
  appOAuth2SecretTestTimeout,
  describeRequestFailure,
  getAppOAuth2SecretTestValues,
} from '../../../../../utils/appOAuth2SecretTest.js';
import { argv } from '../../../../../utils/argv.js';
import {
  hasLoginRoleMappings,
  resolveLoginRoleMappings,
} from '../../../../../utils/loginRoleMappings.js';
import { getAccessToken, getUserInfo } from '../../../../../utils/oauth2.js';

export async function testAppOAuth2SecretLogin(ctx: Context): Promise<void> {
  const values = await getAppOAuth2SecretTestValues(ctx);
  const { code } = ctx.request.body;

  let tokens: TokenResponse;
  try {
    tokens = await getAccessToken(
      values.tokenUrl,
      code,
      String(new URL('/callback', argv.host)),
      values.clientId,
      values.clientSecret,
      appOAuth2SecretTestTimeout,
    );
  } catch (error) {
    ctx.body = { error: { check: 'tokenUrl', ...describeRequestFailure(error) } };
    return;
  }

  const { access_token: accessToken, id_token: idToken } = tokens;
  const result: AppOAuth2SecretLoginTest = {
    idToken: (idToken && jwt.decode(idToken, { json: true })) || undefined,
    accessToken: jwt.decode(accessToken, { json: true }) ?? undefined,
  };
  try {
    if (values.userInfoUrl) {
      const { data } = await axios.get(values.userInfoUrl, {
        headers: { authorization: `Bearer ${accessToken}` },
        timeout: appOAuth2SecretTestTimeout,
        ...(await getSSRFProtectedAgents({ hostname: new URL(values.userInfoUrl).hostname })),
      });
      // Only claims are shown, not other content the URL may serve.
      if (typeof data === 'object') {
        result.userInfo = data;
      }
    }
    result.user = await getUserInfo(accessToken, idToken, values.userInfoUrl, values.remapper);
  } catch (error) {
    result.error =
      error instanceof AppsembleError
        ? { check: 'userInfoUrl', reason: 'noSubject' }
        : { check: 'userInfoUrl', ...describeRequestFailure(error) };
    ctx.body = result;
    return;
  }

  if (hasLoginRoleMappings(values.roleMappings)) {
    result.roles = resolveLoginRoleMappings(result.user.groups, values.roleMappings).map(
      ({ role }) => role,
    );
  }
  ctx.body = result;
}
