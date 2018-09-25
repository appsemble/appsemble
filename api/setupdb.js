#!/usr/bin/env node
import setupModels from './utils/setupModels';

async function main() {
  // Drop the tables related to every model and create them.
  const { sequelize } = await setupModels(true, true);
  sequelize.close();
}


main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
