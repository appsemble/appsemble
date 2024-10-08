import { type ReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

interface OrganizationArguments {
  description: string;
  email: string;
  id: string;
  icon: ReadStream;
  name: string;
  website: string;
}

export async function createOrganization({
  description,
  email,
  icon,
  id,
  name,
  website,
}: OrganizationArguments): Promise<void> {
  const formData = new FormData();
  formData.append('id', id);

  if (description) {
    logger.info(`Setting description to ${description}`);
    formData.append('description', description);
  }

  if (email) {
    logger.info(`Setting email to ${email}`);
    formData.append('email', email);
  }

  if (icon) {
    logger.info(`Including icon ${icon.path || 'from stdin'}`);
    formData.append('icon', icon);
  }

  if (name) {
    logger.info(`Setting name to ${name}`);
    formData.append('name', name);
  }

  if (website) {
    logger.info(`Setting website to ${website}`);
    formData.append('website', website);
  }

  logger.info(`Creating organization ${id}${name ? ` (${name})` : ''}`);
  try {
    await axios.post('/api/organizations', formData);
    logger.info(`Successfully created organization ${id}${name ? ` (${name})` : ''}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateOrganization({
  description,
  email,
  icon,
  id,
  name,
  website,
}: OrganizationArguments): Promise<void> {
  logger.info(`Updating organization ${id}${name ? ` (${name})` : ''}`);

  const formData = new FormData();

  if (description) {
    logger.info(`Setting description to ${description}`);
    formData.append('description', description);
  }

  if (email) {
    logger.info(`Setting email to ${email}`);
    formData.append('email', email);
  }

  if (icon) {
    logger.info(`Including icon ${icon.path || 'from stdin'}`);
    formData.append('icon', icon);
  }

  if (name) {
    logger.info(`Setting name to ${name}`);
    formData.append('name', name);
  }

  if (website) {
    logger.info(`Setting website to ${website}`);
    formData.append('website', website);
  }

  try {
    await axios.patch(`/api/organizations/${id}`, formData);
    logger.info(`Successfully updated organization ${id}${name ? ` (${name})` : ''}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function upsertOrganization({
  description,
  email,
  icon,
  id,
  name,
  website,
}: OrganizationArguments): Promise<void> {
  try {
    await axios.get(`/api/organizations/${id}`);
    await updateOrganization({ description, email, icon, id, name, website });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await createOrganization({ description, email, icon, id, name, website });
    } else {
      logger.error(error);
      throw error;
    }
  }
}
