import { defineMessages } from 'react-intl';

export default defineMessages({
  explanation: 'OAuth2 client credentials allow applications to perform actions on your behalf.',
  empty:
    'You currently haven’t registered any OAuth2 clients. If you don’t know what this is, you should probably leave this empty.',
  register: 'Register',
  created: 'Created',
  description: 'Description',
  descriptionHelp: 'A short description to render in the overview',
  expires: 'Expires',
  never: 'Never',
  expiresHelp: 'The date on which the client credentials expire',
  credentials: 'Client credentials',
  credentialsHelp: 'Never share these client credentials with anyone.',
  cancel: 'Cancel',
  submit: 'Create',
  scope: 'Scope',
  revoke: 'Revoke',
  unknownScope: 'This scope is not currently known. You may want to revoke this client.',
});
