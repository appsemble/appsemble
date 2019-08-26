import { defineMessages } from 'react-intl';

export default defineMessages({
  createApp: 'Press here to create a new app',
  createAppTitle: 'Create new App',
  cancel: 'Cancel',
  create: 'Create',
  error: 'Something went wrong when creating this app.',
  name: 'Name',
  description: 'Description',
  nameConflict: 'An app with the name “{name}” already exists in this organization.',
  missingBlocks: `Unknown {blockCount, plural,
    one {block}
    other {blocks}
  } or {blockCount, plural,
    one {block version}
    other {block versions}
  } found: {blocks}
  `,
  template: 'Template',
  organization: 'Organization',
  resources: 'Resources',
  includeResources: 'Include example resources',
  private: 'Private',
  privateHelp: 'Hide this app from the public app list',
});
