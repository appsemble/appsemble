import { Checkbox, FormComponent, Loader, useMessages } from '@appsemble/react-components';
import { AppDefinition, ResourceHooks } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Permission } from '../../actions/serviceWorker';
import settings from '../../utils/settings';
import TitleBar from '../TitleBar';
import styles from './AppSettings.css';
import messages from './messages';

interface AppSettingsProps {
  definition: AppDefinition;
  subscribed: boolean;
  registration: ServiceWorkerRegistration;
  requestPermission: () => Promise<Permission>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

interface ResourceState {
  [resourceType: string]: SubscriptionState;
}

interface SubscriptionState {
  create?: ResourceHooks & { subscribed: boolean };
  update?: ResourceHooks & { subscribed: boolean };
  delete?: ResourceHooks & { subscribed: boolean };
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function AppSettings({
  definition,
  requestPermission,
  subscribe,
  registration,
  unsubscribe,
  subscribed,
}: AppSettingsProps): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const [subscriptions, setSubscriptions] = React.useState<ResourceState>();

  React.useEffect(() => {
    const subs = Object.entries(definition.resources).reduce<ResourceState>(
      (acc, [resourceType, resource]) => {
        Object.keys(resource)
          .filter(key => ['create', 'update', 'delete'].includes(key))
          .forEach((key: keyof SubscriptionState) => {
            if (
              resource[key].hooks &&
              resource[key].hooks.notification &&
              resource[key].hooks.notification.subscribe
            ) {
              if (!acc[resourceType]) {
                acc[resourceType] = {};
              }
              acc[resourceType][key] = { ...resource[key].hooks, subscribed: false };
            }
          });

        return acc;
      },
      {},
    );

    if (registration) {
      registration.pushManager.getSubscription().then(async sub => {
        if (!sub || !sub.endpoint) {
          setSubscriptions(subs);
          return;
        }
        const { endpoint } = sub;
        try {
          const { data } = await axios.get<{
            [type: string]: { create: boolean; update: boolean; delete: boolean };
          }>(`/api/apps/${settings.id}/subscriptions`, { params: { endpoint } });
          Object.entries(data).forEach(([key, whatever]) => {
            if (!Object.prototype.hasOwnProperty.call(subs, key)) {
              return;
            }

            Object.entries(whatever).forEach(([action, value]) => {
              if (!Object.prototype.hasOwnProperty.call(subs[key], action)) {
                return;
              }

              subs[key][action as keyof SubscriptionState].subscribed = value;
            });
          });
        } catch (error) {
          push('Something went wrong when trying to fetch your subscription settings');
        }
        setSubscriptions(subs);
      });
    }
  }, [registration, definition, push]);

  const onSubscribeClick = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    event.preventDefault();

    if (subscribed) {
      await unsubscribe();
      push({ body: intl.formatMessage(messages.unsubscribeSuccess), color: 'info' });
      return;
    }

    if (window.Notification && window.Notification.permission === 'denied') {
      push({ body: intl.formatMessage(messages.blocked), color: 'warning' });
      return;
    }

    const result = await requestPermission();
    if (result !== 'granted') {
      push({ body: intl.formatMessage(messages.permissionDenied), color: 'danger' });
      return;
    }

    try {
      await subscribe();
      push({ body: intl.formatMessage(messages.subscribeSuccessful), color: 'success' });
    } catch (error) {
      push({ body: intl.formatMessage(messages.subscribeError), color: 'danger' });
    }
  };

  const onSubscriptionChange = async (
    resource: string,
    action: keyof SubscriptionState,
    value: boolean,
  ): Promise<void> => {
    try {
      const { endpoint } = await registration.pushManager.getSubscription();
      await axios.patch(`/api/apps/${settings.id}/subscriptions`, {
        endpoint,
        resource,
        action,
        value,
      });

      setSubscriptions({
        ...subscriptions,
        [resource]: {
          ...subscriptions[resource],
          [action]: { ...subscriptions[resource][action], subscribed: value },
        },
      });
    } catch (error) {
      push({ body: intl.formatMessage(messages.subscribeError), color: 'danger' });
    }
  };

  if (subscriptions == null) {
    return <Loader />;
  }

  return (
    <>
      <TitleBar>
        <FormattedMessage {...messages.settings} />
      </TitleBar>
      <div className={styles.root}>
        {(definition.notifications !== undefined || Object.keys(subscriptions).length) && (
          <>
            <FormComponent label={<FormattedMessage {...messages.notifications} />} required>
              <div className={styles.setting}>
                <p className={styles.settingDescription}>
                  <FormattedMessage {...messages.suscribeDescription} />
                </p>
                <Checkbox
                  className={styles.checkbox}
                  help={<FormattedMessage {...messages.subscribe} />}
                  name="subscribe"
                  onChange={onSubscribeClick}
                  switch
                  value={subscribed}
                />
              </div>
            </FormComponent>

            <FormComponent label={<FormattedMessage {...messages.subscriptions} />} required>
              {Object.entries(subscriptions).map(([resourceType, resource]) => (
                <FormComponent
                  key={resourceType}
                  label={
                    <FormattedMessage
                      {...messages.resourceSubscriptions}
                      values={{ resource: resourceType }}
                    />
                  }
                  required
                >
                  {Object.keys(resource)
                    .filter(
                      (key: 'create' | 'update' | 'delete') =>
                        resource[key].notification.subscribe === 'all' ||
                        resource[key].notification.subscribe === 'both',
                    )
                    .map((key: 'create' | 'update' | 'delete') => (
                      <Checkbox
                        key={`${resourceType}.${key}`}
                        className={styles.subscribeCheckbox}
                        disabled={!subscribed || !resource.create}
                        help={
                          <FormattedMessage
                            {...messages.subscriptionLabel}
                            values={{
                              resource: resourceType,
                              actionVerb: <FormattedMessage {...messages[key]} />,
                            }}
                          />
                        }
                        name={`${resourceType}.${key}`}
                        onChange={(_, value) => onSubscriptionChange(resourceType, key, value)}
                        switch
                        value={subscriptions[resourceType][key].subscribed}
                      />
                    ))}
                </FormComponent>
              ))}
            </FormComponent>
          </>
        )}
      </div>
    </>
  );
}
