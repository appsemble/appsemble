import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';

import { type OrganizationSsoDomain as OrganizationSsoDomainSettings } from '@appsemble/types';

import { type OrganizationSsoDomain } from '../models/index.js';

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

export function getOrganizationSsoDomainSettings(
  claim: OrganizationSsoDomain,
): OrganizationSsoDomainSettings {
  return {
    domain: claim.domain,
    verified: claim.verifiedAt != null,
    managedBy: claim.managedBy,
    recordName: `_appsemble-sso.${claim.domain}`,
    recordValue: claim.token ? `appsemble-sso=${claim.token}` : '',
  };
}
