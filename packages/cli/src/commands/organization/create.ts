import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import type { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import type { BaseArguments } from '../../types';

interface CreateOrganizationArguments extends BaseArguments {
  id: string;
  name: string;
}

export const command = 'create <id>';
export const description =
  'Register a new organization. You will be the owner of the new organization.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('id', {
      describe: 'The id for the newly created organization',
    })
    .option('name', {
      describe: 'The name of the organization.',
    });
}

export async function handler({
  clientCredentials,
  id,
  name,
  remote,
}: CreateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);
  const organizationId = id.startsWith('@') ? id.slice(1) : id;

  logger.info(`Creating organization @${organizationId}${name ? ` (${name})` : ''}`);
  await axios.post('/api/organizations', { id: organizationId, name });
  logger.info(`Successfully created organization @${organizationId}${name ? ` (${name})` : ''}`);
}
