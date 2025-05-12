import { hash } from 'bcrypt';
import pg from 'pg';
import { type Argv } from 'yargs';

const { DATABASE_HOST, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USER } =
  process.env;

export const command = 'seed-account';
export const description = 'Seed a user and an account with specified credentials.';

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
      required: true,
    })
    .option('clientCredentials', {
      type: 'string',
      required: true,
    });
}

interface Args {
  name: string;
  email: string;
  password: string;
  timezone: string;
  clientCredentials: string;
}

async function insert(
  table: string,
  columns: string[],
  values: any[],
  client: pg.Client,
): Promise<void> {
  const params = columns.map((item, index) => `$${index + 1}`);
  const query = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${params.join(', ')})`;

  await client.query(query, values);
}

export async function handler({
  clientCredentials,
  email,
  name,
  password,
  timezone,
}: Args): Promise<void> {
  const client = new pg.Client({
    database: DATABASE_NAME,
    host: DATABASE_HOST,
    port: DATABASE_PORT ? Number(DATABASE_PORT) : undefined,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
  });
  await client.connect();

  const hashedPassword = await hash(password, 10);

  const [clientId, clientPassword] = clientCredentials.split(':');

  const hashedClientPassword = await hash(clientPassword, 10);

  const UserId = 'd69d6e83-57b5-4011-9c96-d85f7afd402c';

  await insert(
    'User',
    ['id', 'name', '"primaryEmail"', 'password', 'timezone', 'created', 'updated'],
    [UserId, name, email, hashedPassword, timezone, 'NOW()', 'NOW()'],
    client,
  );

  await insert(
    'EmailAuthorization',
    ['email', 'verified', 'created', 'updated', '"UserId"'],
    [email, true, 'NOW()', 'NOW()', UserId],
    client,
  );

  await insert(
    'OAuth2ClientCredentials',
    ['id', 'secret', 'description', 'scopes', 'created', '"UserId"'],
    [
      clientId,
      hashedClientPassword,
      'Used for provisioning the review environment',
      'apps:write resources:write assets:write blocks:write organizations:write groups:write',
      'NOW()',
      UserId,
    ],
    client,
  );

  await client.end();
}
