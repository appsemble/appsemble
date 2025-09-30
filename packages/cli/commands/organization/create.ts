import { type ReadStream } from 'node:fs';

import { authenticate } from '@appsemble/node-utils';
import { type PaymentProvider } from '@appsemble/types';
import { type Argv } from 'yargs';

import { coerceFile } from '../../lib/coercers.js';
import { createOrganization } from '../../lib/organization.js';
import { type BaseArguments } from '../../types.js';

interface CreateOrganizationArguments extends BaseArguments {
  description: string;
  email: string;
  id: string;
  name: string;
  website: string;
  icon: ReadStream;
  preferredPaymentProvider: PaymentProvider;
  vatIdNumber: string;
  streetName: string;
  houseNumber: string;
  city: string;
  zipCode: string;
  countryCode: string;
  invoiceReference: string;
}

export const command = 'create <id>';
export const description =
  'Register a new organization. You will be the owner of the new organization.';

export function builder(yargs: Argv): Argv<any> {
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
    })
    .option('preferredPaymentProvider', {
      describe: 'The preferred payment provider of the organization.',
    })
    .option('vatIdNumber', {
      describe: 'The VAT id number of the organization.',
    })
    .option('streetName', {
      describe: 'Street name of the organization',
    })
    .option('houseNumber', {
      describe: 'House number of the organization',
    })
    .option('city', {
      describe: 'City of the organization',
    })
    .option('zipCode', {
      describe: 'Zip code of the organization',
    })
    .option('countryCode', {
      describe: 'Country code of the country where the organization is located',
    })
    .option('invoiceReference', {
      describe: 'Optional reference the organization can set to appear on the invoice.',
    });
}

export async function handler({
  city,
  clientCredentials,
  countryCode,
  description: desc,
  email,
  houseNumber,
  icon,
  id,
  invoiceReference,
  name,
  preferredPaymentProvider,
  remote,
  streetName,
  vatIdNumber,
  website,
  zipCode,
}: CreateOrganizationArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);
  await createOrganization({
    description: desc,
    email,
    invoiceReference,
    icon,
    id,
    name,
    preferredPaymentProvider,
    website,
    streetName,
    houseNumber,
    city,
    zipCode,
    countryCode,
    vatIdNumber,
  });
}
