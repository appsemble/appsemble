import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Reset Password',
  description: 'Request a password reset for your Appsemble user',
  requestButton: 'Send',
  requestFailed: 'Request failed',
  requestSuccess:
    'Request accepted! If an account matches that email address, you should receive an email with instructions on how to reset your password shortly.',
  emailLabel: 'Email',
  emailMissing: 'This should be a valid email address',
  emailRequired: 'An email address is required',
});
