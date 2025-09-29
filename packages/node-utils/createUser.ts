import { hash } from 'bcrypt';
import { Client, type Client as ClientType, type QueryResult } from 'pg';
import { v4 as uuid } from 'uuid';

const {
  DATABASE_HOST = 'localhost',
  DATABASE_NAME = 'appsemble',
  DATABASE_PASSWORD = 'password',
  DATABASE_PORT = 5432,
  DATABASE_USER = 'admin',
} = process.env;

async function insert(
  table: string,
  columns: string[],
  values: any[],
  client: ClientType,
): Promise<QueryResult<any>> {
  const params = columns.map((item, index) => `$${index + 1}`);
  const query = `INSERT INTO "${table}" (${columns.join(', ')}) VALUES (${params.join(', ')})`;

  const result = await client.query(query, values);
  return result;
}

/**
 * Creates a new user in the database
 *
 * @param name Name of the user
 * @param email Primary email of the user
 * @param password Password
 * @param timezone Timezone of the user
 * @param clientCredentials Used to make OAuth client credentials for permissions
 */
export async function createUser(
  name: string,
  email: string,
  password: string,
  timezone?: string,
  clientCredentials?: string,
): Promise<void> {
  if (!DATABASE_HOST || !DATABASE_NAME || !DATABASE_PASSWORD || !DATABASE_PORT || !DATABASE_USER) {
    throw new Error('Missing database credentials');
  }

  const client = new Client({
    database: DATABASE_NAME,
    host: DATABASE_HOST,
    port: DATABASE_PORT ? Number(DATABASE_PORT) : undefined,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
  });
  await client.connect();

  const hashedPassword = await hash(password, 10);
  const userId = uuid();

  await insert(
    'User',
    ['id', 'name', '"primaryEmail"', 'password', 'timezone', 'created', 'updated'],
    [userId, name, email, hashedPassword, timezone ?? 'Europe/Amsterdam', 'NOW()', 'NOW()'],
    client,
  );

  await insert(
    'EmailAuthorization',
    ['email', 'verified', 'created', 'updated', '"UserId"'],
    [email, true, 'NOW()', 'NOW()', userId],
    client,
  );

  if (clientCredentials) {
    const [clientId, clientPassword] = clientCredentials.split(':');
    const hashedClientPassword = await hash(clientPassword, 10);

    await insert(
      'OAuth2ClientCredentials',
      ['id', 'secret', 'description', 'scopes', 'created', '"UserId"'],
      [
        clientId,
        hashedClientPassword,
        'Used for provisioning the review environment',
        'apps:write resources:write assets:write blocks:write organizations:write groups:write',
        'NOW()',
        userId,
      ],
      client,
    );
  }

  await client.end();
}
