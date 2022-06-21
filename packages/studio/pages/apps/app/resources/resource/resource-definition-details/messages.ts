import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  pageTitle: 'Details',
  title: '{resourceName} Details',
  endpoints: 'Endpoints',
  properties: 'Properties',
  description:
    'In order to access any of the endpoints of the <apiLink>API</apiLink> for this resource, unless the resource is marked as {public}, you must make sure each request is provided with an access token as described <securityLink>here</securityLink>.',
});
