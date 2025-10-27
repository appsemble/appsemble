import { type OpenAPIV3 } from 'openapi-types';

import { normalized } from '../../../constants/index.js';

export const Organization: OpenAPIV3.NonArraySchemaObject = {
  type: 'object',
  description: 'An organization groups a set of users, apps, themes, and permissions together',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: normalized.source,
      minLength: 1,
      maxLength: 30,
      description: 'The unique identifier for the organization.',
    },
    name: {
      type: 'string',
      description: 'The display name for the organization.',
    },
    description: {
      type: 'string',
      description: 'The description of the organization.',
      maxLength: 160,
    },
    email: {
      type: 'string',
      description: 'The email address of the organization.',
    },
    website: {
      type: 'string',
      description: 'The website of the organization.',
    },
    iconUrl: {
      type: 'string',
      description: 'The URL used to fetch the organization’s icon.',
    },
    vatIdNumber: {
      type: 'string',
      description: 'The VAT id number of the organization.',
    },
    streetName: {
      type: 'string',
      description: 'Street name that will appear on the invoice.',
    },
    houseNumber: {
      type: 'string',
      description: 'House number of the organization,',
    },
    city: {
      type: 'string',
      description: 'City where the organization is located',
    },
    zipCode: {
      type: 'string',
      description: 'Zip code of the organization',
    },
    countryCode: {
      type: 'string',
      description: 'Country code of the country where the organization is located',
    },
    invoiceReference: {
      type: 'string',
      description: 'The reference identifier that will appear on the invoices.',
    },
    stripeCustomerId: {
      type: 'string',
      description:
        'Stripe internal ID of the customer used to match it with the organization in our database.',
    },
  },
};
