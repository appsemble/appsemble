import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.WKtGHy',
    defaultMessage: 'Secrets',
  },
  appsembleLogin: {
    id: 'studio.T0V0Ht',
    defaultMessage: 'Appsemble Login',
  },
  displayAppsembleLogin: {
    id: 'studio.mXGY9/',
    defaultMessage: 'Display Appsemble login method',
  },
  displayAppsembleOAuth2Login: {
    id: 'studio.NbKWvJ',
    defaultMessage: 'Display Appsemble OAuth2 login method',
  },
  displaySelfRegistration: {
    id: 'studio.mK9mKF',
    defaultMessage: 'Enable self registration',
  },
  emailSettings: {
    id: 'studio.ONdhzp',
    defaultMessage: 'Email settings',
  },
  emailName: {
    id: 'studio.25w127',
    defaultMessage: 'Email name',
  },
  emailNameDescription: {
    id: 'studio.hj7ydT',
    defaultMessage:
      "The name displayed for emails sent for this app. For example: John Doe '<'test@example.com'>', or just ‘test@example.com’",
  },
  emailUser: {
    id: 'studio.T2uuVK',
    defaultMessage: 'Email username',
  },
  emailUserDescription: {
    id: 'studio.Jx1BPg',
    defaultMessage: 'The username used for authentication for the custom SMTP server.',
  },
  emailHost: {
    id: 'studio.MoWiAL',
    defaultMessage: 'Email host',
  },
  emailHostDescription: {
    id: 'studio.Mf7tW7',
    defaultMessage: 'The hostname for the custom SMTP server. For example: smtp.gmail.com',
  },
  emailPassword: {
    id: 'studio.FJJ/BR',
    defaultMessage: 'Email password',
  },
  emailPasswordDescription: {
    id: 'studio.Rba9By',
    defaultMessage:
      'The password used for authentication for the custom SMTP server. This will be encrypted upon submitting.',
  },
  emailPort: {
    id: 'studio.o0NC6H',
    defaultMessage: 'Email port',
  },
  emailPortDescription: {
    id: 'studio.35INhb',
    defaultMessage:
      'The port for the custom SMTP server. By default this is 587 for secure SMTP and 25 for standard SMTP.',
  },
  emailSecure: {
    id: 'studio.xr3EHZ',
    defaultMessage: 'Secure',
  },
  emailSecureDescription: {
    id: 'studio.c6JUlO',
    defaultMessage:
      'Whether SSL should be used for the custom SMTP server. Leave checked if you’re not sure.',
  },
  emailUpdateSuccess: {
    id: 'studio.ONK4Gi',
    defaultMessage: 'Successfully updated email settings',
  },
  emailSettingsError: {
    id: 'studio.m0jOVR',
    defaultMessage: 'Something went wrong when trying to fetch the email settings',
  },
  emailLoading: {
    id: 'studio.4seAx1',
    defaultMessage: 'Loading email settings…',
  },
  submit: {
    id: 'studio.wSZR47',
    defaultMessage: 'Submit',
  },
  submitError: {
    id: 'studio.N/9y2I',
    defaultMessage: 'Something went wrong when trying to update the email settings',
  },
  ssl: {
    id: 'studio.WhIybZ',
    defaultMessage: 'SSL',
  },
  sslDescription: {
    id: 'studio./32Rj2',
    defaultMessage:
      'Bring your own SSL certificate to secure your app. Find out more from the <link>documentation</link>.',
  },
  paymentSettings: {
    id: 'studio.Ar3oN9',
    defaultMessage: 'Payment settings',
  },
  paymentSettingsError: {
    id: 'studio.PCxAlQ',
    defaultMessage: 'Something went wrong trying to fetch payment settings.',
  },
  paymentLoading: {
    id: 'studio.9F2+AK',
    defaultMessage: 'Loading payment settings...',
  },
  paymentUpdateSuccess: {
    id: 'studio.XuZJvq',
    defaultMessage: 'Successfully updated payment settings',
  },
  stripeApiKeyDescription: {
    id: 'studio.Askm/X',
    defaultMessage: 'API key used by the app to access your Stripe account.',
  },
  stripeApiKey: {
    id: 'studio.+B//bs',
    defaultMessage: 'Stripe API key',
  },
  stripeSecretDescription: {
    id: 'studio.pyYEl7',
    defaultMessage: 'Secret used for verifying incoming Stripe webhooks',
  },
  stripeSecret: {
    id: 'studio.iN4q1l',
    defaultMessage: 'Stripe secret',
  },
  successUrl: {
    id: 'studio.KKcB2l',
    defaultMessage: 'Success URL',
  },
  successUrlDescription: {
    id: 'studio.PNifr6',
    defaultMessage:
      'URL to which the user will be redirected after successfully completing the payment.',
  },
  cancelUrl: {
    id: 'studio.6UUyhT',
    defaultMessage: 'Cancel URL',
  },
  cancelUrlDescription: {
    id: 'studio.GSqyxD',
    defaultMessage:
      'RL to which the user will be redirected after failing to complete the payment.',
  },
});
