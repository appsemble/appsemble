import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Register New Account',
  description: 'Register a new Appsemble account',
  registerButton: 'Register',
  registerFailed: 'Register failed',
  registerSuccess:
    'Successfully registered! Please check your email for instructions on verifying your account.',
  nameLabel: 'Display name',
  nameHelp: 'This is used to personalize communication',
  passwordLabel: 'Password',
  emailLabel: 'Email',
  emailInvalid: 'This must be a valid email address',
  emailRequired: 'An email address is required',
  organizationLabel: 'Organization',
  optional: 'Optional',
  emailConflict: 'This email address has already been registered.',
  organizationConflict:
    'An organization with this name already exists. To join an existing organization you must be invited by someone from this organization using your email address.',
});
