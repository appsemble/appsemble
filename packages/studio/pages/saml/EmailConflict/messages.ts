import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  emailConflict: 'The received email address is already linked to an existing Appsemble account.',
  emailConflictExplanation:
    'Please log in using your Appsemble account to continue. If you continue without an email address, apps will be unable to send you emails.',
  login: 'Login',
  skipLogin: 'Continue without email',
  skipLoginError: 'There was a problem continueing the login. Please try again.',
});
