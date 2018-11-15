import { defineMessages } from 'react-intl';

export default defineMessages({
  logoutButton: 'Logout',
  schemaValidationFailed:
    'App schema validation failed. Please check if the following properties are correct: {properties}',
  appNotFound: 'App does not exist',
  error: 'Something went wrong trying to load this app',
  errorUpdate: 'Something went wrong trying to update the app recipe',
  errorUpdateIcon: 'Something went wrong trying to update the app icon',
  invalidYaml: 'Invalid YAML',
  updateSuccess: 'Successfully updated app recipe',
  unexpected: 'Something went wrong when validating the app recipe',
});
