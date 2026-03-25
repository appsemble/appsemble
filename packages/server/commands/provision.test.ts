import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionPlanType } from '@appsemble/types';

import { reconcileDNS } from '../utils/dns/index.js';
import {
  EmailAuthorization,
  getDB,
  OAuth2ClientCredentials,
  Organization,
  OrganizationMember,
  OrganizationSubscription,
  User,
} from '../models/index.js';
import { provision, type ProvisionOptions } from './provision.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn((value: string) => Promise.resolve(`hashed:${value}`)),
}));

vi.mock('@appsemble/node-utils', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../utils/dns/index.js', () => ({
  reconcileDNS: vi.fn(() => Promise.resolve()),
}));

const transaction = {};
const transactionWrapper = vi.fn((callback: (transaction: object) => Promise<void>) =>
  callback(transaction),
);

vi.mock('../models/index.js', () => ({
  EmailAuthorization: {
    create: vi.fn(() => Promise.resolve()),
    findByPk: vi.fn(() => Promise.resolve(null)),
  },
  getDB: vi.fn(() => ({ transaction: transactionWrapper })),
  OAuth2ClientCredentials: {
    create: vi.fn(() => Promise.resolve()),
    findByPk: vi.fn(() => Promise.resolve(null)),
  },
  Organization: {
    create: vi.fn(() => Promise.resolve({ id: 'appsemble', name: 'appsemble' })),
    findByPk: vi.fn(() => Promise.resolve(null)),
  },
  OrganizationMember: {
    create: vi.fn(() => Promise.resolve()),
    findOne: vi.fn(() => Promise.resolve(null)),
  },
  OrganizationSubscription: {
    create: vi.fn(() => Promise.resolve()),
    findOne: vi.fn(() => Promise.resolve(null)),
  },
  User: {
    create: vi.fn(() => Promise.resolve({ id: 'user-id' })),
    findOne: vi.fn(() => Promise.resolve(null)),
  },
}));

const options: ProvisionOptions = {
  appDomainStrategy: 'kubernetes-ingress',
  clientCredentials: 'client-id:client-secret',
  host: 'https://1234.appsemble.review',
  organizationId: 'appsemble',
  organizationRole: 'Maintainer' as ProvisionOptions['organizationRole'],
  organizationSubscription: SubscriptionPlanType.Enterprise,
  skipCustomDomains: false,
  userEmail: 'bot@appsemble.test',
  userName: 'Bot',
  userPassword: 'super-secret',
  userTimezone: 'Europe/Amsterdam',
};

describe('provision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDB).mockReturnValue({ transaction: transactionWrapper } as never);
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue({ id: 'user-id' } as never);
    vi.mocked(EmailAuthorization.findByPk).mockResolvedValue(null);
    vi.mocked(Organization.findByPk).mockResolvedValue(null);
    vi.mocked(Organization.create).mockResolvedValue({
      id: 'appsemble',
      name: 'appsemble',
    } as never);
    vi.mocked(OrganizationMember.findOne).mockResolvedValue(null);
    vi.mocked(OrganizationSubscription.findOne).mockResolvedValue(null);
    vi.mocked(OAuth2ClientCredentials.findByPk).mockResolvedValue(null);
  });

  it('creates the bootstrap records and reconciles dns', async () => {
    await provision(options);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bot',
        password: 'hashed:super-secret',
        primaryEmail: 'bot@appsemble.test',
        timezone: 'Europe/Amsterdam',
      }),
      { transaction },
    );
    expect(Organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'appsemble', name: 'appsemble' }),
      { transaction },
    );
    expect(OrganizationSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        OrganizationId: 'appsemble',
        subscriptionPlan: SubscriptionPlanType.Enterprise,
      }),
      { transaction },
    );
    expect(OAuth2ClientCredentials.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'client-id',
        secret: 'hashed:client-secret',
        UserId: 'user-id',
      }),
      { transaction },
    );
    expect(reconcileDNS).toHaveBeenCalledWith({ dryRun: false, skipCustomDomains: false });
  });

  it('fails fast on invalid client credentials', async () => {
    await expect(
      provision({
        ...options,
        clientCredentials: 'invalid',
      }),
    ).rejects.toThrowError('The --client-credentials value must be formatted as <id>:<secret>.');
  });
});
