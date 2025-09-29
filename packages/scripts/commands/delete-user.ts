import { deleteUser } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

export const command = 'delete-user';
export const description = 'Delete user with the specified email.';

export function builder(argv: Argv): Argv<any> {
  return argv.option('email', {
    type: 'string',
    required: true,
  });
}

interface Args {
  email: string;
}

export async function handler({ email }: Args): Promise<void> {
  await deleteUser(email);
}
