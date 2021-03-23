import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  invalidState: 'The state parameter is invalid. Please try again.',
  registrationConflict:
    'The linked email address is already assigned to an existing Appsemble account. Please login and try again.',
  loginError: 'There was a problem logging in. Please try again.',
  confirmCreateText: 'Would you like to create an account using this {provider} account?',
  confirmCreate: 'Create new account',
  confirmLinkText: 'Would you like to link this {provider} account to your Appsemble account?',
  confirmLink: 'Link account',
  loginInstead:
    'Already have an account? <link>Login</link> and link to an existing account instead.',
});
