import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  createApp: 'Create new App',
  cancel: 'Cancel',
  create: 'Create',
  createVerifyMessage:
    'In order to create a new organization you must first verify your email address. Refresh the page once you have verified your email.',
  createOrganizationInstructions:
    'In order to create an app you must be in an organization and have the permission to create new apps. You can create one below or have someone invite you to an existing organization.',
  error: 'Something went wrong when creating this app.',
  name: 'Name',
  description: 'Description',
  nameConflict: 'An app with this name already exists in this organization.',
  template: 'Template',
  organization: 'Organization',
  resources: 'Resources',
  includeResources: 'Include example resources',
  visibilityLabel: 'Visibility',
  visibilityDescription:
    'Public apps are available in the app store. Unlisted apps aren’t listed publicly, but they are accessible using a direct link. Private apps are only visible to organization members.',
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
});
