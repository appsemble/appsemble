import { Client } from 'pg';

const {
  DATABASE_HOST = 'localhost',
  DATABASE_NAME = 'appsemble',
  DATABASE_PASSWORD = 'password',
  DATABASE_PORT = 5432,
  DATABASE_USER = 'admin',
} = process.env;

/**
 * Deletes user from the database
 *
 * @param email Primary email of the user to delete
 */
export async function deleteUser(email: string): Promise<void> {
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

  await client.query(`DELETE FROM "User" WHERE "primaryEmail" = '${email}'`);

  await client.end();
}
