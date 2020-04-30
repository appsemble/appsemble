import type { UserInfo } from '@appsemble/types';
import Boom from '@hapi/boom';
import axios from 'axios';

const userInfoMap = {
  // https://docs.gitlab.com/ee/integration/openid_connect_provider.html
  gitlab: 'https://gitlab.com/oauth/userinfo',

  // https://developers.google.com/identity/protocols/OpenIDConnect
  google: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export default async function getUserInfo(
  provider: keyof typeof userInfoMap,
  accessToken: string,
): Promise<UserInfo> {
  if (!Object.prototype.hasOwnProperty.call(userInfoMap, provider)) {
    throw Boom.notImplemented(`Unknown provider: ${provider}`);
  }

  const url = userInfoMap[provider];
  const { data } = await axios.get(url, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
}
