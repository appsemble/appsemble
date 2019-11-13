import { defineMessages } from 'react-intl';

export default defineMessages({
  title: 'Register New Account',
  registerButton: 'Register',
  registerFailed: 'Register failed',
  registerSuccess:
    'Successfully registered! Please check your email for instructions on verifying your account.',
  passwordLabel: 'Password',
  passwordRequired: 'A password is required',
  emailLabel: 'Email',
  emailInvalid: 'This must be a valid email address',
  emailRequired: 'An email address is required',
  organizationLabel: 'Organization',
  optional: 'Optional',
  emailConflict: 'This email address has already been registered.',
  organizationConflict:
    'An organization with this name already exists. To join an existing organization you must be invited by someone from this organization using your email address.',
});
