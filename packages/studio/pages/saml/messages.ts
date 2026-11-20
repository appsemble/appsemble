import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  invalidRelayState: {
    id: 'studio.N8FhP4',
    defaultMessage: 'The relay state received is invalid.',
  },
  invalidSecret: {
    id: 'studio.TJCXJF',
    defaultMessage: 'An invalid attribute consume service endpoint was used.',
  },
  invalidStatusCode: {
    id: 'studio.YqrhDL',
    defaultMessage: 'The status code in the SAML response is invalid.',
  },
  badSignature: {
    id: 'studio.eFNjHH',
    defaultMessage: 'The SAML response was signed using the wrong certificate.',
  },
  missingSubject: {
    id: 'studio.oGBluO',
    defaultMessage: 'The subject is missing from the SAML response.',
  },
  missingNameID: {
    id: 'studio.xg78+f',
    defaultMessage: 'The name ID is missing from the SAML response.',
  },
});
