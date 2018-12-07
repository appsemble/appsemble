import bcrypt from 'bcrypt';

import setupModels from '../utils/setupModels';
import databaseBuilder from './builder/database';

export const command = 'initialize';
export const description = 'Initialize the database, then exit.';

export function builder(yargs) {
  return databaseBuilder(yargs);
}

export async function handler(argv) {
  const db = await setupModels({
    sync: true,
    force: true,
    logging: true,
    host: argv.databaseHost,
    dialect: argv.databaseDialect,
    port: argv.databasePort,
    username: argv.databaseUser,
    password: argv.databasePassword,
    database: argv.databaseName,
    uri: argv.databaseUrl,
  });
  const { OAuthClient, EmailAuthorization } = db.models;
  await OAuthClient.create({
    clientId: 'appsemble-editor',
    clientSecret: 'appsemble-editor-secret',
    redirectUri: '/editor',
  });
  const email = await EmailAuthorization.create({
    email: 'test@example.com',
    name: 'Test Account',
    password: bcrypt.hashSync('test', 10),
    verified: true,
  });
  await email.createUser();
  const user = await email.getUser();
  await user.createOrganization({ name: 'Test User Organization' });
  await db.close();
}
