import { createUser } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

export const command = 'create-user';
export const description = 'Create a user account with specified credentials.';

export function builder(argv: Argv): Argv<any> {
  return argv
    .option('name', {
      type: 'string',
      required: true,
    })
    .option('email', {
      type: 'string',
      required: true,
    })
    .option('password', {
      type: 'string',
      required: true,
    })
    .option('timezone', {
      type: 'string',
    })
    .option('clientCredentials', {
      type: 'string',
    })
    .option('organization', {
      type: 'string',
    });
}

interface Args {
  name: string;
  email: string;
  password: string;
  timezone?: string;
  clientCredentials?: string;
  organization?: string;
}

export async function handler({
  clientCredentials,
  email,
  name,
  organization,
  password,
  timezone,
}: Args): Promise<void> {
  await createUser(name, email, password, timezone, clientCredentials, organization);
}
