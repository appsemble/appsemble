import { type ReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import { type PaymentProvider } from '@appsemble/types';
import axios from 'axios';
import FormData from 'form-data';

interface OrganizationArguments {
  description: string;
  email: string;
  id: string;
  icon: ReadStream;
  name: string;
  website: string;
  preferredPaymentProvider: PaymentProvider;
  vatIdNumber: string | null;
  streetName: string | null;
  houseNumber: string | null;
  city: string | null;
  zipCode: string | null;
  countryCode: string | null;
  invoiceReference: string | null;
}

export async function createOrganization({
  city,
  countryCode,
  description,
  email,
  houseNumber,
  icon,
  id,
  invoiceReference,
  name,
  preferredPaymentProvider,
  streetName,
  vatIdNumber,
  website,
  zipCode,
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

  if (preferredPaymentProvider) {
    logger.info(`Setting preferred payment provider to ${preferredPaymentProvider}`);
    formData.append('preferredPaymentProvider', preferredPaymentProvider);
  }

  if (vatIdNumber) {
    logger.info(`Setting vatIdNumber to ${vatIdNumber}`);
    formData.append('vatIdNumber', vatIdNumber);
  }

  if (streetName) {
    logger.info(`Setting street name to ${streetName}`);
    formData.append('streetName', streetName);
  }

  if (houseNumber) {
    logger.info(`Setting house number to ${houseNumber}`);
    formData.append('houseNumber', houseNumber);
  }

  if (city) {
    logger.info(`Setting city to ${city}`);
    formData.append('city', city);
  }

  if (zipCode) {
    logger.info(`Setting zip code to ${zipCode}`);
    formData.append('zipCode', zipCode);
  }

  if (countryCode) {
    logger.info(`Setting country code to ${countryCode}`);
    formData.append('countryCode', countryCode);
  }

  if (invoiceReference) {
    logger.info(`Setting invoice reference name to ${invoiceReference}`);
    formData.append('invoiceReference', invoiceReference);
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
  city,
  countryCode,
  description,
  email,
  houseNumber,
  icon,
  id,
  invoiceReference,
  name,
  preferredPaymentProvider,
  streetName,
  vatIdNumber,
  website,
  zipCode,
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

  if (preferredPaymentProvider) {
    logger.info(`Setting preferred payment provider to ${preferredPaymentProvider}`);
    formData.append('preferredPaymentProvider', preferredPaymentProvider);
  }

  if (vatIdNumber) {
    logger.info(`Setting vat id number to ${vatIdNumber}`);
    formData.append('vatIdNumber', vatIdNumber);
  }

  if (streetName) {
    logger.info(`Setting street name to ${streetName}`);
    formData.append('streetName', streetName);
  }

  if (houseNumber) {
    logger.info(`Setting house number to ${houseNumber}`);
    formData.append('houseNumber', houseNumber);
  }

  if (city) {
    logger.info(`Setting city to ${city}`);
    formData.append('city', city);
  }

  if (zipCode) {
    logger.info(`Setting zip code to ${zipCode}`);
    formData.append('zipCode', zipCode);
  }

  if (countryCode) {
    logger.info(`Setting country code to ${countryCode}`);
    formData.append('countryCode', countryCode);
  }

  if (invoiceReference) {
    logger.info(`Setting invoice reference name to ${invoiceReference}`);
    formData.append('invoiceReference', invoiceReference);
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
  city,
  countryCode,
  description,
  email,
  houseNumber,
  icon,
  id,
  invoiceReference,
  name,
  preferredPaymentProvider,
  streetName,
  vatIdNumber,
  website,
  zipCode,
}: OrganizationArguments): Promise<void> {
  try {
    await axios.get(`/api/organizations/${id}`);
    await updateOrganization({
      description,
      email,
      icon,
      id,
      name,
      website,
      preferredPaymentProvider,
      vatIdNumber,
      streetName,
      houseNumber,
      city,
      zipCode,
      countryCode,
      invoiceReference,
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      await createOrganization({
        description,
        email,
        icon,
        id,
        name,
        website,
        preferredPaymentProvider,
        vatIdNumber,
        streetName,
        houseNumber,
        city,
        zipCode,
        countryCode,
        invoiceReference,
      });
    } else {
      logger.error(error);
      throw error;
    }
  }
}
