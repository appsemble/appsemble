import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  createApp: 'Create new App',
  cancel: 'Cancel',
  create: 'Create',
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
    'Public apps are available in the app store. Unlisted apps aren’t listed publicly, but they are accessible using a direct link. Private apps are only visible to those organization members.',
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
});
