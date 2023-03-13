import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Secrets',
  appsembleLogin: 'Appsemble Login',
  displayAppsembleLogin: 'Display Appsemble login method',
  displayAppsembleOAuth2Login: 'Display Appsemble OAuth2 login method',
  emailSettings: 'Email settings',
  emailName: 'Email name',
  emailNameDescription:
    "The name displayed for emails sent for this app. For example: John Doe '<'test@example.com'>', or just ‘test@example.com’",
  emailUser: 'Email username',
  emailUserDescription: 'The username used for authentication for the custom SMTP server.',
  emailHost: 'Email host',
  emailHostDescription: 'The hostname for the custom SMTP server. For example: smtp.gmail.com',
  emailPassword: 'Email password',
  emailPasswordDescription:
    'The password used for authentication for the custom SMTP server. This will be encrypted upon submitting.',
  emailPort: 'Email port',
  emailPortDescription:
    'The port for the custom SMTP server. By default this is 587 for secure SMTP and 25 for standard SMTP.',
  emailSecure: 'Secure',
  emailSecureDescription:
    'Whether SSL should be used for the custom SMTP server. Leave checked if you’re not sure.',
  emailUpdateSuccess: 'Successfully updated email settings',
  emailSettingsError: 'Something went wrong when trying to fetch the email settings',
  emailLoading: 'Loading email settings…',
  submit: 'Submit',
  submitError: 'Something went wrong when trying to submit this form',
  ssl: 'SSL',
});
