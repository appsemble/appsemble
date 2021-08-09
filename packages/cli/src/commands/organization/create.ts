import { ReadStream } from 'fs';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { coerceFile } from '../../lib/coercers';
import { BaseArguments } from '../../types';

interface CreateOrganizationArguments extends BaseArguments {
  description: string;
  email: string;
  id: string;
  name: string;
  website: string;
  icon: ReadStream;
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
    })
    .option('icon', {
      describe: 'The file location of the icon representing the organization.',
      coerce: coerceFile,
    });
}

export async function handler({
  clientCredentials,
  description: desc,
  email,
  icon,
  id,
  name,
  remote,
  website,
}: CreateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);

  const formData = new FormData();
  formData.append('id', id);

  if (desc) {
    logger.info(`Setting description to ${desc}`);
    formData.append('description', desc);
  }

  if (email) {
    logger.info(`Setting email to ${email}`);
    formData.append('email', email);
  }

  if (icon) {
    logger.info(`Including icon ${icon.path || 'from stdin'}`);
    formData.append('icon', icon);
  }

  if (name) {
    logger.info(`Setting name to ${name}`);
    formData.append('name', name);
  }

  if (website) {
    logger.info(`Setting website to ${website}`);
    formData.append('website', website);
  }

  logger.info(`Creating organization ${id}${name ? ` (${name})` : ''}`);
  await axios.post('/api/organizations', formData);
  logger.info(`Successfully created organization ${id}${name ? ` (${name})` : ''}`);
}
