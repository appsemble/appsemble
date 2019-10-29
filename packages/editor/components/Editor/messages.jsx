import { defineMessages } from 'react-intl';

export default defineMessages({
  title: '{name} · Editor',
  schemaValidationFailed:
    'App schema validation failed. Please check if the following properties are correct: {properties}',
  appNotFound: 'App does not exist',
  yamlNotFound:
    'Unable to restore original YAML. Formatting may be different from what was previously published.',
  delete: 'Delete',
  deleteWarningTitle: 'Deleting app',
  deleteWarning: 'Are you sure you want to delete this app? This action cannot be reverted.',
  error: 'Something went wrong trying to load this app',
  deleteSuccess: 'Succesfully deleted app {name}',
  errorDelete: 'Something went wrong trying to delete this app',
  errorUpdate: 'Something went wrong trying to update the app recipe',
  forbidden: 'User is not allowed to update this app',
  invalidYaml: 'Invalid YAML',
  invalidStyle: 'Invalid CSS',
  updateSuccess: 'Successfully updated app recipe',
  unexpected: 'Something went wrong when validating the app recipe',
  resourceWarningTitle: 'Resource warning',
  resourceWarning:
    'The resource definitions in this app recipe contain different data from the original. This may cause unexpected results when using older data.',
  preview: 'Preview',
  publish: 'Publish',
  viewLive: 'View live',
  recipe: 'Recipe',
  coreStyle: 'Core style',
  sharedStyle: 'Shared style',
  iframeTitle: 'App preview',
  cancel: 'Cancel',
});
