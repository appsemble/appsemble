import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  invalidRelayState: 'The relay state received is invalid.',
  invalidSecret: 'An invalid attribute consume service endpoint was used.',
  invalidStatusCode: 'The status code in the SAML response is invalid.',
  badSignature: 'The SAML response was signed using the wrong certificate.',
  missingSubject: 'The subject is missing from the SAML response.',
  missingNameID: 'The name ID is missing from the SAML response.',
  emailConflict: 'The received e-mail address is already linked to an existing Appsemble account.',
  emailConflictExplanation:
    'Please log in using your Appsemble account to continue. If you continue without an email address, apps will be unable to send you emails.',
  login: 'Login',
  skipLogin: 'Continue without email',
  skipLoginError: 'There was a problem continueing the login. Please try again.',
});
