import { authenticate } from '@appsemble/node-utils';
import { authorizeClientCredentials } from '@appsemble/server';
import { type AxiosTestInstance } from 'axios-test-instance';
import { hash } from 'bcrypt';

export async function authorizeCLI(scopes: string, testingApp: AxiosTestInstance): Promise<string> {
  const OAuth2AuthorizationCode = await authorizeClientCredentials(scopes);
  const { id, secret } = OAuth2AuthorizationCode;
  await OAuth2AuthorizationCode.update({ secret: await hash(secret, 10) });
  await authenticate(testingApp.defaults.baseURL!, scopes, `${id}:${secret}`);
  return `${id}:${secret}`;
}
