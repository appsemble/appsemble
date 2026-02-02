import { argv } from '../utils/argv.js';

export function getSecurityEmail(): string {
  return argv.securityEmail ?? 'security@appsemble.com';
}
