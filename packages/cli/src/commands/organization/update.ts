import { ReadStream } from 'fs';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { coerceFile } from '../../lib/coercers';
import { BaseArguments } from '../../types';

interface UpdateOrganizationArguments extends BaseArguments {
  description: string;
  email: string;
  id: string;
  logo: ReadStream;
  name: string;
  website: string;
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
    .option('email', {
      describe: 'The email address users may use to contact the organization',
    })
    .option('website', {
      describe: 'The website of the organization',
    })
    .option('description', {
      describe: 'A short of the organization',
    })
    .option('logo', {
      describe: 'The file location of the logo representing the organization.',
      coerce: coerceFile,
    });
}

export async function handler({
  clientCredentials,
  description: desc,
  email,
  id,
  logo,
  name,
  remote,
  website,
}: UpdateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);

  logger.info(`Updating organization ${id}${name ? ` (${name})` : ''}`);

  const formData = new FormData();

  if (desc) {
    logger.info(`Setting description to ${desc}`);
    formData.append('description', desc);
  }

  if (email) {
    logger.info(`Setting email to ${email}`);
    formData.append('email', email);
  }

  if (logo) {
    logger.info(`Including logo ${logo.path || 'from stdin'}`);
    formData.append('icon', logo);
  }

  if (name) {
    logger.info(`Setting name to ${name}`);
    formData.append('name', name);
  }

  if (website) {
    logger.info(`Setting website to ${website}`);
    formData.append('website', website);
  }

  await axios.patch(`/api/organizations/${id}`, formData);
  logger.info(`Successfully updated organization ${id}${name ? ` (${name})` : ''}`);
}
