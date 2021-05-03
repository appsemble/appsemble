import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  appLogo: 'App logo',
  cancel: 'Cancel',
  clone: 'Clone App',
  name: 'Name',
  nameDescription: 'The name of the app',
  description: 'Description',
  descriptionDescription: 'A short description of what the app can do.',
  private: 'Private',
  privateDescription: 'Hide this app from the public app list',
  organization: 'Organization',
  submit: 'Create',
  view: 'View App',
  resources: 'Resources',
  resourcesDescription: 'Copy any resources that are allowed to be cloned.',
  readMore: 'Read more',
  readLess: 'Read less',
  cloneLoginMessage:
    'In order to clone apps you must be logged in. Click <loginLink>here</loginLink> to log in using an existing account or <registerLink>here</registerLink> to register a new account.',
  cloneVerifyMessage:
    'In order to create a new organization you must first verify your email address. Refresh the page once you have verified your email.',
  cloneOrganizationInstructions:
    'In order to create an app you must be in an organization and have the permission to create new apps. You can create one below or have someone invite you to an existing organization.',
});
