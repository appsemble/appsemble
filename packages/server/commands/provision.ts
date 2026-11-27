import { hash } from 'bcrypt';
import { logger } from '@appsemble/node-utils';
import {
  PredefinedOrganizationRole,
  predefinedOrganizationRoles,
  SubscriptionPlanType,
} from '@appsemble/types';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import {
  EmailAuthorization,
  getDB,
  initDB,
  OAuth2ClientCredentials,
  Organization,
  OrganizationMember,
  OrganizationSubscription,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { reconcileDNS } from '../utils/dns/index.js';
import { createServiceAccount } from '../utils/serviceAccounts.js';
import { handleDBError } from '../utils/sqlUtils.js';

const provisionDescription = 'Provisioned service account';
const provisionScopes =
  'apps:write resources:write assets:write blocks:write organizations:write groups:write';

export interface ProvisionOptions {
  appDomainStrategy?: string;
  clientCredentials: string;
  host?: string;
  organizationId: string;
  organizationRole?: PredefinedOrganizationRole;
  organizationSubscription: SubscriptionPlanType;
  skipCustomDomains: boolean;
  userEmail?: string;
  userName?: string;
  userPassword?: string;
  userTimezone?: string;
}

export const command = 'provision';
export const description =
  'Provision the default organization, its service account, a bootstrap user, and DNS state';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('organization-id', {
      desc: 'The id of the organization to provision.',
      required: true,
      type: 'string',
    })
    .option('organization-role', {
      choices: predefinedOrganizationRoles,
      default: 'Maintainer',
      desc: 'The role to grant the bootstrap user in the organization.',
    })
    .option('organization-subscription', {
      choices: Object.values(SubscriptionPlanType),
      default: SubscriptionPlanType.Free,
      desc: 'The subscription plan to set on the organization.',
    })
    .option('user-email', {
      desc: 'The bootstrap user email address. Without it, no bootstrap user is provisioned.',
      implies: ['user-name', 'user-password'],
      type: 'string',
    })
    .option('user-name', {
      desc: 'The bootstrap user name.',
      type: 'string',
    })
    .option('user-password', {
      desc: 'The bootstrap user password.',
      type: 'string',
    })
    .option('user-timezone', {
      default: 'Europe/Amsterdam',
      desc: 'The bootstrap user timezone.',
      type: 'string',
    })
    .option('client-credentials', {
      desc: 'The <id>:<secret> client credentials of the Maintainer service account to create or update.',
      required: true,
      type: 'string',
    })
    .option('app-domain-strategy', {
      choices: ['kubernetes-ingress'],
      desc: 'How to link app domain names to apps.',
    })
    .option('ingress-class-name', {
      default: 'nginx',
      desc: 'The class name of the ingresses to create.',
    })
    .option('ingress-annotations', {
      desc: 'A JSON string representing ingress annotations to add to created ingresses.',
      implies: ['service-name', 'service-port'],
    })
    .option('service-name', {
      desc: 'The name of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-port'],
    })
    .option('service-port', {
      desc: 'The port of the service to which the ingress should point if app-domain-strategy is set to kubernetes-ingress',
      implies: ['service-name'],
    })
    .option('issuer', {
      conflicts: ['cluster-issuer'],
      desc: 'The name of the cert-manager issuer to use for apps.',
    })
    .option('cluster-issuer', {
      conflicts: ['issuer'],
      desc: 'The name of the cert-manager cluster issuer to use for apps.',
    })
    .option('host', {
      desc: 'The external host on which the server is available. This should include the protocol, hostname, and optionally port.',
      type: 'string',
    })
    .option('skip-custom-domains', {
      default: false,
      desc: 'If specified, certificates for ingresses for custom domains of apps and app collections will not be issued.',
      type: 'boolean',
    });
}

export async function provision({
  appDomainStrategy,
  clientCredentials,
  host,
  organizationId,
  organizationRole,
  organizationSubscription,
  skipCustomDomains,
  userEmail,
  userName,
  userPassword,
  userTimezone,
}: ProvisionOptions): Promise<void> {
  const [clientId, clientSecret] = clientCredentials.split(':');
  if (!clientId || !clientSecret) {
    throw new Error('The --client-credentials value must be formatted as <id>:<secret>.');
  }

  const clientSecretHash = await hash(clientSecret, 10);

  await getDB().transaction(async (transaction) => {
    let organization = await Organization.findByPk(organizationId, {
      paranoid: false,
      transaction,
    });

    if (organization) {
      if (organization.deleted) {
        await organization.restore({ transaction });
      }
      logger.info(`Updated organization ${organizationId}`);
    } else {
      organization = await Organization.create(
        {
          id: organizationId,
          name: organizationId,
        },
        { transaction },
      );
      logger.info(`Created organization ${organizationId}`);
    }

    if (userEmail) {
      const passwordHash = await hash(userPassword!, 10);
      let user = await User.findOne({
        paranoid: false,
        transaction,
        where: { primaryEmail: userEmail },
      });

      if (user) {
        if (user.deleted) {
          await user.restore({ transaction });
        }
        await user.update(
          {
            name: userName,
            password: passwordHash,
            primaryEmail: userEmail,
            timezone: userTimezone,
          },
          { transaction },
        );
        logger.info(`Updated bootstrap user ${userEmail}`);
      } else {
        user = await User.create(
          {
            name: userName,
            password: passwordHash,
            primaryEmail: userEmail,
            timezone: userTimezone,
          },
          { transaction },
        );
        logger.info(`Created bootstrap user ${userEmail}`);
      }

      const emailAuthorization = await EmailAuthorization.findByPk(userEmail, { transaction });
      await (emailAuthorization
        ? emailAuthorization.update(
            {
              UserId: user.id,
              disabled: null,
              key: null,
              verified: true,
            },
            { transaction },
          )
        : EmailAuthorization.create(
            {
              email: userEmail,
              UserId: user.id,
              verified: true,
            },
            { transaction },
          ));

      const membership = await OrganizationMember.findOne({
        transaction,
        where: {
          OrganizationId: organizationId,
          UserId: user.id,
        },
      });

      if (membership) {
        if (membership.role !== organizationRole) {
          await membership.update({ role: organizationRole }, { transaction });
        }
      } else {
        await OrganizationMember.create(
          {
            OrganizationId: organizationId,
            UserId: user.id,
            role: organizationRole,
          },
          { transaction },
        );
      }
    }

    const subscription = await OrganizationSubscription.findOne({
      transaction,
      where: { OrganizationId: organizationId },
    });

    await (subscription
      ? subscription.update(
          {
            cancelled: false,
            cancelledAt: null,
            cancellationReason: null,
            expirationDate: null,
            renewalPeriod: null,
            subscriptionPlan: organizationSubscription,
          },
          { transaction },
        )
      : OrganizationSubscription.create(
          {
            cancelled: false,
            expirationDate: null,
            OrganizationId: organizationId,
            renewalPeriod: null,
            subscriptionPlan: organizationSubscription,
          },
          { transaction },
        ));

    const credentials = await OAuth2ClientCredentials.findByPk(clientId, { transaction });
    if (credentials) {
      const serviceAccount = await OrganizationMember.findOne({
        transaction,
        where: { OrganizationId: organizationId, UserId: credentials.UserId, serviceAccount: true },
      });
      if (!serviceAccount) {
        throw new Error(
          `Client credentials ${clientId} belong to an account other than a service account of ${organizationId}.`,
        );
      }
      await serviceAccount.update({ role: PredefinedOrganizationRole.Maintainer }, { transaction });
      await credentials.update(
        {
          description: provisionDescription,
          expires: null,
          scopes: provisionScopes,
          secret: clientSecretHash,
        },
        { transaction },
      );
    } else {
      await createServiceAccount(
        {
          description: provisionDescription,
          id: clientId,
          OrganizationId: organizationId,
          role: PredefinedOrganizationRole.Maintainer,
          scopes: provisionScopes,
          secret: clientSecretHash,
        },
        transaction,
      );
    }
  });

  if (appDomainStrategy) {
    if (!host) {
      throw new Error('The --host argument is required when --app-domain-strategy is set.');
    }
    await reconcileDNS({ dryRun: false, skipCustomDomains });
    logger.info(`Reconciled DNS after provisioning ${organizationId}`);
  }
}

export async function handler(): Promise<void> {
  try {
    initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  await provision({
    appDomainStrategy: argv.appDomainStrategy,
    clientCredentials: argv.clientCredentials,
    host: argv.host,
    organizationId: argv.organizationId,
    organizationRole: argv.organizationRole as PredefinedOrganizationRole,
    organizationSubscription: argv.organizationSubscription as SubscriptionPlanType,
    skipCustomDomains: argv.skipCustomDomains,
    userEmail: argv.userEmail,
    userName: argv.userName,
    userPassword: argv.userPassword,
    userTimezone: argv.userTimezone,
  });

  process.exit();
}
