import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Notifications',
  titleLabel: 'Title',
  bodyLabel: 'Message',
  enableInstructions:
    'Push notifications are currently not enabled in this app. To enable sending out push notifications, please enable this in the <link>app definition</link> by specifying the “{navigation}” property.',
  requestButton: 'Send notification',
  submitSuccess: 'Successfully sent notification!',
  submitError: 'Something went wrong when submitting this notification.',
});
