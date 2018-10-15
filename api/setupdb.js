#!/usr/bin/env node
import setupModels from './utils/setupModels';

async function main() {
  const database = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/appsemble';

  // Drop the tables related to every model and create them.
  const { sequelize, OAuthClient } = await setupModels({ sync: true, force: true, database });
  await OAuthClient.create({
    clientId: 'appsemble-editor',
    clientSecret: 'appsemble-editor-secret',
    redirectUri: '/editor',
  });
  sequelize.close();
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
