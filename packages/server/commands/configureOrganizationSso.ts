import { readFile } from 'node:fs/promises';

import { logger } from '@appsemble/node-utils';
import { type OrganizationSsoConfiguration } from '@appsemble/types';
import { Op } from 'sequelize';
import { parse } from 'yaml';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import {
  initDB,
  OrganizationMember,
  OrganizationSso,
  OrganizationSsoDomain,
  OrganizationSsoSession,
} from '../models/index.js';
import { argv } from '../utils/argv.js';
import { applyOrganizationSsoConfiguration } from '../utils/organizationSso.js';
import { normalizeOrganizationSsoDomain } from '../utils/organizationSsoDomain.js';

export const command = 'configure-organization-sso';
export const description = 'Apply deployment-managed organization single sign-on configuration';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs)
    .option('config', {
      desc: 'A YAML mapping of organization IDs to their single sign-on configuration.',
      type: 'string',
      demandOption: true,
    })
    .option('aes-secret', {
      desc: 'The key used to encrypt organization single sign-on credentials.',
      type: 'string',
      demandOption: true,
    });
}

export async function handler({ config }: { config: string }): Promise<void> {
  const definitions = parse(await readFile(config, 'utf8')) as Record<
    string,
    Omit<OrganizationSsoConfiguration, 'clientSecret'> & {
      clientSecretFile: string;
      domains?: string[];
    }
  >;
  if (!definitions || typeof definitions !== 'object' || Array.isArray(definitions)) {
    throw new Error('The single sign-on configuration must be a mapping of organization IDs.');
  }
  const configurations = await Promise.all(
    Object.entries(definitions).map(async ([organizationId, definition]) => {
      const { clientSecretFile, domains = [], ...configuration } = definition;
      if (!Array.isArray(domains)) {
        throw new TypeError(`The discovery domains for ${organizationId} must be an array.`);
      }
      const discoveryDomains = [...new Set(domains.map(normalizeOrganizationSsoDomain))];
      const clientSecret = (await readFile(clientSecretFile, 'utf8')).trim();
      if (!clientSecret) {
        throw new Error(`The single sign-on client secret for ${organizationId} is empty.`);
      }
      return [organizationId, { ...configuration, clientSecret }, discoveryDomains] as const;
    }),
  );
  const db = initDB({
    host: argv.databaseHost,
    port: argv.databasePort,
    username: argv.databaseUser,
    password: argv.databasePassword,
    database: argv.databaseName,
    ssl: argv.databaseSsl,
    uri: argv.databaseUrl,
  });
  try {
    const removedOrganizations = await db.transaction(async (transaction) => {
      for (const [organizationId, configuration, domains] of configurations) {
        await applyOrganizationSsoConfiguration(
          organizationId,
          configuration,
          'deployment',
          transaction,
        );
        await OrganizationSsoDomain.destroy({
          where: {
            OrganizationId: organizationId,
            domain: { [Op.notIn]: domains },
          },
          transaction,
        });
        for (const domain of domains) {
          await OrganizationSsoDomain.upsert(
            {
              OrganizationId: organizationId,
              domain,
              managedBy: 'deployment',
              token: null,
              verifiedAt: new Date(),
            },
            { transaction },
          );
        }
      }
      const removed = await OrganizationSso.findAll({
        where: {
          managedBy: 'deployment',
          OrganizationId: { [Op.notIn]: Object.keys(definitions) },
        },
        transaction,
      });
      for (const sso of removed) {
        await OrganizationMember.destroy({
          where: { OrganizationId: sso.OrganizationId, role: null, guest: false },
          transaction,
        });
        await OrganizationSsoSession.destroy({
          where: { OrganizationId: sso.OrganizationId },
          transaction,
        });
        await sso.destroy({ transaction });
      }
      return removed.map((sso) => sso.OrganizationId);
    });
    logger.info(
      `Applied deployment-managed organization single sign-on: ${JSON.stringify({
        configured: Object.keys(definitions),
        removed: removedOrganizations,
      })}`,
    );
  } finally {
    await db.close();
  }
}
