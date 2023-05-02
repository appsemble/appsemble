import { type ReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

interface CreateOrganizationArguments {
  description: string;
  email: string;
  id: string;
  name: string;
  website: string;
  icon: ReadStream;
}

interface UpdateOrganizationArguments {
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
}: CreateOrganizationArguments): Promise<void> {
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
  await axios.post('/api/organizations', formData);
  logger.info(`Successfully created organization ${id}${name ? ` (${name})` : ''}`);
}

export async function updateOrganization({
  description,
  email,
  icon,
  id,
  name,
  website,
}: UpdateOrganizationArguments): Promise<void> {
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

  await axios.patch(`/api/organizations/${id}`, formData);
  logger.info(`Successfully updated organization ${id}${name ? ` (${name})` : ''}`);
}
