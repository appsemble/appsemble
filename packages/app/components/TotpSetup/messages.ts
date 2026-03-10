import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'app.yX0QbY',
    defaultMessage: 'Set Up Two-Factor Authentication',
  },
  description: {
    id: 'app.3T/vEQ',
    defaultMessage:
      'Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.) or enter the secret key manually.',
  },
  requiredNotice: {
    id: 'app.EC/0me',
    defaultMessage:
      'Two-factor authentication is required for this app. Please set it up to continue.',
  },
  loading: {
    id: 'app.f3m0kT',
    defaultMessage: 'Setting up two-factor authentication...',
  },
  setupError: {
    id: 'app.2z2nlm',
    defaultMessage: 'Failed to set up two-factor authentication. Please try again.',
  },
  setupSuccess: {
    id: 'app.1tcgN/',
    defaultMessage: 'Two-factor authentication has been enabled successfully.',
  },
  secretKey: {
    id: 'app.JHBmG8',
    defaultMessage: 'Secret Key',
  },
  verifyCode: {
    id: 'app.Tjv3UC',
    defaultMessage: 'Verification Code',
  },
  verifyCodePlaceholder: {
    id: 'app.k7a5KE',
    defaultMessage: 'Enter 6-digit code',
  },
  verifyButton: {
    id: 'app.NZGEXH',
    defaultMessage: 'Verify and Enable',
  },
  cancelButton: {
    id: 'app.47FYwb',
    defaultMessage: 'Cancel',
  },
  verifyError: {
    id: 'app.Et3RBS',
    defaultMessage: 'Failed to verify the code. Please try again.',
  },
  invalidCode: {
    id: 'app.QTxhvT',
    defaultMessage: 'Invalid verification code',
  },
  copiedToClipboard: {
    id: 'app.QcPbuz',
    defaultMessage: 'Secret key copied to clipboard',
  },
  copyError: {
    id: 'app.EJN9ug',
    defaultMessage: 'Failed to copy secret key',
  },
});
