import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  emailConflict: {
    id: 'studio./22B+g',
    defaultMessage:
      'The received email address is already linked to an existing Appsemble account.',
  },
  emailConflictExplanation: {
    id: 'studio.W5GwEt',
    defaultMessage:
      'Please log in using your Appsemble account to continue. If you continue without an email address, apps will be unable to send you emails.',
  },
  login: {
    id: 'studio.AyGauy',
    defaultMessage: 'Login',
  },
  skipLogin: {
    id: 'studio.2gVIoW',
    defaultMessage: 'Continue without email',
  },
  skipLoginError: {
    id: 'studio.FRvJC8',
    defaultMessage: 'There was a problem continueing the login. Please try again.',
  },
});
