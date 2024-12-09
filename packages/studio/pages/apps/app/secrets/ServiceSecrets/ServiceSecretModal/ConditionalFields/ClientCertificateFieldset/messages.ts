import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  certificateLabel: {
    id: 'studio.FMhPQ6',
    defaultMessage: 'Certificate',
  },
  certificateHelp: {
    id: 'studio.fwTvvS',
    defaultMessage: 'The public certificate for client certificate authentication in PEM format',
  },
  privateKeyLabel: {
    id: 'studio.Bep/gA',
    defaultMessage: 'Private key',
  },
  privateKeyHelp: {
    id: 'studio./EEoOd',
    defaultMessage: 'The private key for client certificate authentication in PEM format',
  },
  caLabel: {
    id: 'studio.ulrsBf',
    defaultMessage: 'Certificate authority',
  },
  caHelp: {
    id: 'studio.wRZVkH',
    defaultMessage:
      'The custom certificate authority. Can be a chain of certificates in PEM format',
  },
});
