import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  loadingError: 'There was a problem loading your SSL credentials',
  loadingMessage: 'Loading SSL secrets…',
  prequisiteWarning: 'Custom SSL certificates can only be applied if your app has a custom domain',
  submitError: 'There was a problem saving your SSL credentials',
  submitSuccess: 'SSL credentials saved successfully',
  certLabel: 'SSL certificate',
  certHelp: 'The fully resolved SSL certificate in PEM format',
  keyLabel: 'SSL private key',
  keyHelp: 'The private key used to sign the SSL certificate in PEM format',
  submit: 'Submit',
});
