import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';

export function normalizeOrganizationSsoDomain(value: string): string {
  const input = value.trim().toLowerCase();
  const domain = domainToASCII(input);
  if (
    !/^[\p{L}\p{M}\p{N}.-]+$/u.test(input) ||
    domain.length > 238 ||
    isIP(domain) ||
    !/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/u.test(domain)
  ) {
    throw new Error('Enter a valid email domain without a URL or wildcard.');
  }
  return domain;
}
