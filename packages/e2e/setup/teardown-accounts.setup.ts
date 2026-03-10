import { rm } from 'node:fs/promises';

import { deleteUser } from '@appsemble/node-utils';
import { test as setup } from '@playwright/test';

setup('delete worker accounts', async ({}, testInfo) => {
  for (let i = 0; i < testInfo.config.workers; i += 1) {
    const email = `worker-${i}@appsemble.com`;
    await deleteUser(email);
  }
  await rm(`${testInfo.project.outputDir}/.auth`, { recursive: true, force: true });
});
