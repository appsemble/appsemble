import { type Organization } from '@appsemble/types';
import { test as base } from '@playwright/test';

import { expect } from '../../expect/index.js';

interface OrganizationDetails {
  id: string;
  name?: string;
  description?: string;
  email?: string;
  website?: string;
  icon?: Blob;
}

export interface OrganizationFixtures {
  /**
   * Creates an organization
   *
   * @param details Organization details
   * @returns Created organization
   */
  createOrganization: (details: OrganizationDetails) => Promise<Organization>;

  /**
   * Deletes the organization with the given ID
   *
   * @param id ID of the organization
   */
  deleteOrganization: (id: string) => Promise<void>;
}

export const test = base.extend<OrganizationFixtures>({
  async createOrganization({ request }, use) {
    await use(async (details) => {
      const { description, email, icon, id, name, website } = details;
      const formData = new FormData();

      formData.set('id', id);
      formData.set('name', name ?? '');
      formData.set('description', description ?? '');
      formData.set('email', email ?? '');
      formData.set('website', website ?? 'http');
      formData.set('icon', icon ?? (null as unknown as Blob));

      const response = await request.post('/api/organizations', {
        multipart: formData,
      });
      expect(response.status()).toBe(201);

      return response.json() as unknown as Organization;
    });
  },

  async deleteOrganization({ request }, use) {
    await use(async (id) => {
      const response = await request.delete(`/api/organizations/${id}`);
      expect(response.status()).toBe(200);
    });
  },
});
