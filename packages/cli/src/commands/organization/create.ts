import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { BaseArguments } from '../../types';

interface CreateOrganizationArguments extends BaseArguments {
  description: string;
  email: string;
  id: string;
  name: string;
  website: string;
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
      describe: 'The name of the organization',
    })
    .option('email', {
      describe: 'The email address users may use to contact the organization',
    })
    .option('website', {
      describe: 'The website of the organization',
    })
    .option('description', {
      describe: 'A short of the organization',
    });
}

export async function handler({
  clientCredentials,
  description: desc,
  email,
  id,
  name,
  remote,
  website,
}: CreateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);

  logger.info(`Creating organization ${id}${name ? ` (${name})` : ''}`);
  await axios.post('/api/organizations', { description: desc, email, id, name, website });
  logger.info(`Successfully created organization ${id}${name ? ` (${name})` : ''}`);
}
