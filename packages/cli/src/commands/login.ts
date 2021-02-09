import { login } from '../lib/authentication';

export const command = 'login';
export const description =
  'Save OAuth2 client credentials in the key chain for future sessions on this machine.';

export const handler = login;
