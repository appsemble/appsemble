export { login as handler } from '../lib/authentication.js';

export const command = 'login';
export const description =
  'Save OAuth2 client credentials in the key chain for future sessions on this machine.';
