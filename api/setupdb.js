#!/usr/bin/env node
import { setupModels } from './models';

async function main() {
  // Drop the tables related to every model and create them.
  setupModels(true, true);
}


main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
