import { createUser, deleteUser } from '@appsemble/node-utils';
import { test as setup } from '@playwright/test';

async function ensureAppsembleOrganization(baseURL: string): Promise<void> {
  const organizationResponse = await fetch(`${baseURL}/api/organizations/appsemble`);

  if (organizationResponse.status === 200) {
    return;
  }

  if (organizationResponse.status !== 404) {
    throw new Error(
      `Unexpected status ${organizationResponse.status} while fetching the appsemble organization`,
    );
  }

  const email = 'worker-0@appsemble.com';
  const password = 'worker-0';
  const loginResponse = await fetch(`${baseURL}/api/auth/email/login`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,
    },
  });

  if (loginResponse.status !== 200) {
    throw new Error(
      `Unexpected status ${loginResponse.status} while logging in to create the appsemble organization`,
    );
  }

  const { access_token: accessToken } = (await loginResponse.json()) as { access_token: string };
  const formData = new FormData();

  formData.set('id', 'appsemble');
  formData.set('name', 'Appsemble');
  formData.set('description', '');
  formData.set('email', '');
  formData.set('website', 'http');

  const createResponse = await fetch(`${baseURL}/api/organizations`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (createResponse.status !== 201 && createResponse.status !== 409) {
    throw new Error(
      `Unexpected status ${createResponse.status} while creating the appsemble organization: ${await createResponse.text()}`,
    );
  }
}

setup('create accounts for workers', async ({}, testInfo) => {
  for (let i = 0; i < testInfo.config.workers; i += 1) {
    const id = `worker-${i}`;
    const email = `${id}@appsemble.com`;
    const password = id;

    await deleteUser(email);
    await createUser(id, email, password);
  }

  if (!testInfo.project.use.baseURL) {
    throw new Error('Missing Playwright baseURL');
  }

  await ensureAppsembleOrganization(String(testInfo.project.use.baseURL));
});
