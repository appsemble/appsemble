import type { ReadStream } from 'fs';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import type { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { coerceFile } from '../../lib/coercers';
import type { BaseArguments } from '../../types';

interface UpdateOrganizationArguments extends BaseArguments {
  id: string;
  name: string;
  logo: ReadStream;
}

export const command = 'update <id>';
export const description =
  'Update an existing organization. You must be an owner of the organization.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('id', {
      describe: 'The ID of the organization',
    })
    .option('name', {
      describe: 'The name of the organization.',
    })
    .option('logo', {
      describe: 'The file location of the logo representing the organization.',
      coerce: coerceFile,
    });
}

export async function handler({
  clientCredentials,
  id,
  logo,
  name,
  remote,
}: UpdateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);
  const organizationId = id.startsWith('@') ? id.slice(1) : id;

  logger.info(`Updating organization @${organizationId}${name ? ` (${name})` : ''}`);

  const formData = new FormData();
  if (name) {
    logger.info(`Setting name to ${name}`);
    formData.append('name', name);
  }

  if (logo) {
    logger.info(`Including logo ${logo.path || 'from stdin'}`);
    formData.append('icon', logo);
  }

  await axios.patch(`/api/organizations/${organizationId}`, formData);
  logger.info(`Successfully updated organization @${organizationId}${name ? ` (${name})` : ''}`);
}
