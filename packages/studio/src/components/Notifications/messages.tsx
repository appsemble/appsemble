import { defineMessages } from 'react-intl';

export default defineMessages({
  title: 'Notifications',
  appDefinition: 'app definition',
  titleLabel: 'Title',
  bodyLabel: 'Message',
  enableInstructions:
    'Push notifications are currently not enabled in this app. To enable sending out push notifications, please enable this in the {appDefinition} by specifying the “{navigation}” property.',
  requestButton: 'Send notification',
  submitSuccess: 'Successfully sent notification!',
  submitError: 'Something went wrong when submitting this notification.',
});
