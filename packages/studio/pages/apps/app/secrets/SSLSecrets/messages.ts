import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  loadingError: {
    id: 'studio.vLwklu',
    defaultMessage: 'There was a problem loading your SSL credentials',
  },
  loadingMessage: {
    id: 'studio.aalup0',
    defaultMessage: 'Loading SSL secrets…',
  },
  prequisiteWarning: {
    id: 'studio.5KyK3O',
    defaultMessage: 'Custom SSL certificates can only be applied if your app has a custom domain',
  },
  submitError: {
    id: 'studio.MKvv3M',
    defaultMessage: 'There was a problem saving your SSL credentials',
  },
  submitSuccess: {
    id: 'studio.qyDtDE',
    defaultMessage: 'SSL credentials saved successfully',
  },
  certLabel: {
    id: 'studio.0ImIeM',
    defaultMessage: 'SSL certificate',
  },
  certHelp: {
    id: 'studio.y+mqVR',
    defaultMessage: 'The fully resolved SSL certificate in PEM format',
  },
  keyLabel: {
    id: 'studio.BG8eFL',
    defaultMessage: 'SSL private key',
  },
  keyHelp: {
    id: 'studio.II58L6',
    defaultMessage: 'The private key used to sign the SSL certificate in PEM format',
  },
  submit: {
    id: 'studio.wSZR47',
    defaultMessage: 'Submit',
  },
});
