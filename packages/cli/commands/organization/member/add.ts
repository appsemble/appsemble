import { authenticate } from '@appsemble/node-utils';
import { PredefinedOrganizationRole, predefinedOrganizationRoles } from '@appsemble/types';
import { type Argv } from 'yargs';

import { addOrganizationMember } from '../../../lib/organization.js';
import { type BaseArguments } from '../../../types.js';

interface AddOrganizationMemberArguments extends BaseArguments {
  email: string;
  id: string;
  role: string;
}

export const command = 'add <email>';
export const description = 'Add an existing Appsemble account to an organization.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('email', {
      describe: 'The email address of the account to add',
    })
    .option('id', {
      describe: 'The id of the organization to add the account to',
      demandOption: true,
    })
    .option('role', {
      describe: 'The organization role to assign to the new member',
      choices: predefinedOrganizationRoles,
      default: PredefinedOrganizationRole.Member,
    });
}

export async function handler({
  clientCredentials,
  email,
  id,
  remote,
  role,
}: AddOrganizationMemberArguments): Promise<void> {
  await authenticate(remote, 'organizations:write', clientCredentials);
  await addOrganizationMember({ email, id, role });
}
