import { createUser } from '@appsemble/node-utils';
import { test as setup } from '@playwright/test';

setup('create accounts for workers', async ({}, testInfo) => {
  for (let i = 0; i < testInfo.config.workers; i += 1) {
    const id = `worker-${i}`;
    const email = `${id}@appsemble.com`;
    const password = id;

    await createUser(id, email, password);
  }
});
