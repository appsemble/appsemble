import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  blocked:
    'Notifications have been blocked. Please update your notification permissions and try again.',
  subscribe: 'Subscribe',
  suscribeDescription:
    'Subscribing to an app allows for the app creators to connect with their users by sending push notifications.',
  notifications: 'Notifications',
  subscribed: 'Subscribed',
  notSubscribed: 'Not subscribed',
  subscribeSuccessful: 'Subscribed successfully!',
  subscribeError: 'Something went wrong when trying to subscribe.',
  unsubscribe: 'Unsubscribe',
  unsubscribeSuccess: 'Successfully unsubscribed from notifications.',
  permissionDenied:
    'Unable to subscribe. Either no permission has been granted or your device does not support notifications.',
  subscriptions: 'Subscriptions',
  resourceSubscriptions: '{resource} subscriptions',
  createSubscriptionLabel: 'Get notified when “{resource}” is created',
  updateSubscriptionLabel: 'Get notified when “{resource}” is updated',
  deleteSubscriptionLabel: 'Get notified when “{resource}” is deleted',
});
