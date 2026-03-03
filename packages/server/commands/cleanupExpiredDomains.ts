import dns from 'node:dns/promises';

import { logger } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { Op, type Sequelize } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import {
  App,
  AppCollection,
  initDB,
  Organization,
  OrganizationMember,
  transactional,
  User,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { Mailer } from '../utils/email/Mailer.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-expired-domains';
export const description =
  'Sends emails to organization owners for app and app collection domains that no longer resolve and sets the domain to null.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('smtp-host', {
      desc: 'The host of the SMTP server to connect to.',
    })
    .option('smtp-port', {
      desc: 'The port of the SMTP server to connect to.',
      type: 'number',
    })
    .option('smtp-secure', {
      desc: 'Use TLS when connecting to the SMTP server.',
      type: 'boolean',
      default: false,
    })
    .option('smtp-user', {
      desc: 'The user to use to login to the SMTP server.',
      implies: ['smtp-pass', 'smtp-from'],
    })
    .option('smtp-pass', {
      desc: 'The password to use to login to the SMTP server.',
      implies: ['smtp-user', 'smtp-from'],
    })
    .option('smtp-from', {
      desc: 'The address to use when sending emails.',
      implies: ['smtp-user', 'smtp-pass'],
    });
}

interface DomainCheckResult {
  domain: string;
  resolves: boolean;
  error?: string;
}

async function tryResolve(domain: string): Promise<boolean> {
  try {
    await dns.resolve4(domain);
    return true;
  } catch {
    try {
      await dns.resolve6(domain);
      return true;
    } catch {
      try {
        await dns.resolveCname(domain);
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * Check if a domain resolves via DNS with retries.
 * If DNS resolution fails, the domain may be expired or misconfigured.
 *
 * @param domain The domain name to check.
 * @param retries Number of retries.
 * @returns The result of the DNS check.
 */
async function checkDomainResolves(domain: string, retries = 3): Promise<DomainCheckResult> {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const resolves = await tryResolve(domain);
    if (resolves) {
      return { domain, resolves: true };
    }
    if (attempt < retries) {
      logger.warn(`DNS resolution attempt ${attempt} failed for domain: ${domain}, retrying...`);
    }
  }

  logger.warn(`DNS resolution failed for domain: ${domain} after ${retries} attempts`);
  return { domain, resolves: false, error: 'ENOTFOUND' };
}

async function getOrganizationOwners(
  organizationId: string,
): Promise<{ email: string; name: string | undefined; locale: string | undefined }[]> {
  const members = await OrganizationMember.findAll({
    where: {
      OrganizationId: organizationId,
      role: PredefinedOrganizationRole.Owner,
    },
    include: [
      {
        model: User,
        required: true,
        attributes: ['primaryEmail', 'name', 'locale'],
      },
    ],
  });

  return members
    .filter((member) => member.User?.primaryEmail)
    .map((member) => ({
      email: member.User!.primaryEmail!,
      name: member.User!.name,
      locale: member.User!.locale,
    }));
}

interface PendingEmail {
  type: 'app' | 'appCollection';
  owner: { email: string; name: string | undefined; locale: string | undefined };
  appName?: string;
  collectionName?: string;
  domain: string;
  id: number;
}

export async function cleanupExpiredDomains(existingMailer?: Mailer): Promise<void> {
  const mailer = existingMailer || new Mailer(argv);
  const pendingEmails: PendingEmail[] = [];

  await transactional(async (transaction) => {
    const appsWithDomains = await App.findAll({
      where: {
        domain: { [Op.and]: [{ [Op.not]: null }, { [Op.ne]: '' }] },
      },
      include: [
        {
          model: Organization,
          required: true,
        },
      ],
      transaction,
    });

    logger.info(`Found ${appsWithDomains.length} apps with custom domains.`);

    for (const app of appsWithDomains) {
      const domainResult = await checkDomainResolves(app.domain!);

      if (!domainResult.resolves) {
        logger.info(
          `App ${app.id} domain "${app.domain}" does not resolve (${domainResult.error}). Clearing domain.`,
        );

        const owners = await getOrganizationOwners(app.OrganizationId);

        for (const owner of owners) {
          pendingEmails.push({
            type: 'app',
            owner,
            appName: app.definition.name,
            domain: app.domain!,
            id: app.id,
          });
        }

        await app.update({ domain: null }, { transaction });
        logger.info(`Cleared domain for app ${app.id}`);
      }
    }

    const collectionsWithDomains = await AppCollection.findAll({
      where: {
        domain: { [Op.and]: [{ [Op.not]: null }, { [Op.ne]: '' }] },
      },
      include: [
        {
          model: Organization,
          required: true,
        },
      ],
      transaction,
    });

    logger.info(`Found ${collectionsWithDomains.length} app collections with custom domains.`);

    for (const collection of collectionsWithDomains) {
      const domainResult = await checkDomainResolves(collection.domain!);

      if (!domainResult.resolves) {
        logger.info(
          `AppCollection ${collection.id} domain "${collection.domain}" does not resolve (${domainResult.error}). Clearing domain.`,
        );

        const owners = await getOrganizationOwners(collection.OrganizationId);

        for (const owner of owners) {
          pendingEmails.push({
            type: 'appCollection',
            owner,
            collectionName: collection.name,
            domain: collection.domain!,
            id: collection.id,
          });
        }

        await collection.update({ domain: null }, { transaction });
        logger.info(`Cleared domain for app collection ${collection.id}`);
      }
    }
  });

  for (const email of pendingEmails) {
    try {
      if (email.type === 'app') {
        await mailer.sendTranslatedEmail({
          to: {
            name: email.owner.name,
            email: email.owner.email,
          },
          emailName: 'domainExpired',
          locale: email.owner.locale,
          values: {
            name: email.owner.name,
            appName: email.appName,
            domain: email.domain,
          },
        });
        logger.info(`Sent domain expiration email to ${email.owner.email} for app ${email.id}`);
      } else {
        await mailer.sendTranslatedEmail({
          to: {
            name: email.owner.name,
            email: email.owner.email,
          },
          emailName: 'appCollectionDomainExpired',
          locale: email.owner.locale,
          values: {
            name: email.owner.name,
            collectionName: email.collectionName,
            domain: email.domain,
          },
        });
        logger.info(
          `Sent domain expiration email to ${email.owner.email} for app collection ${email.id}`,
        );
      }
    } catch (error) {
      logger.error(`Failed to send email to ${email.owner.email}`, error);
    }
  }
}

export async function handler(): Promise<void> {
  let db: Sequelize;

  try {
    db = initDB({
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

  await cleanupExpiredDomains();

  logger.info('Finished cleaning up expired domains.');

  await db!.close();
  process.exit();
}
