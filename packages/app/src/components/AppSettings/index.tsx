import { Checkbox, FormComponent, Loader, useMessages } from '@appsemble/react-components';
import type { ResourceHooks, SubscriptionResponse } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import TitleBar from '../TitleBar';
import styles from './index.css';
import messages from './messages';

interface ResourceState {
  [resourceType: string]: SubscriptionState;
}

type ExtendedResourceHooks = ResourceHooks & { subscribed: boolean };

interface SubscriptionState {
  create?: ExtendedResourceHooks;
  update?: ExtendedResourceHooks;
  delete?: ExtendedResourceHooks;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function AppSettings(): React.ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [subscriptions, setSubscriptions] = React.useState<ResourceState>();
  const { definition } = useAppDefinition();
  const {
    requestPermission,
    subscribe,
    subscription,
    unsubscribe,
  } = useServiceWorkerRegistration();

  React.useEffect(() => {
    const subs = Object.entries(definition.resources).reduce<ResourceState>(
      (acc, [resourceType, resource]) => {
        Object.keys(resource)
          .filter((key) => ['create', 'update', 'delete'].includes(key))
          .forEach((key: keyof SubscriptionState) => {
            if (
              resource[key].hooks &&
              resource[key].hooks.notification &&
              resource[key].hooks.notification.subscribe
            ) {
              if (!Object.prototype.hasOwnProperty.call(acc, resourceType)) {
                acc[resourceType] = {};
              }
              acc[resourceType][key] = { ...resource[key].hooks, subscribed: false };
            }
          });

        return acc;
      },
      {},
    );

    if (subscription) {
      const { endpoint } = subscription;
      axios
        .get<SubscriptionResponse>(`${settings.apiUrl}/api/apps/${settings.id}/subscriptions`, {
          params: { endpoint },
        })
        .then(({ data }) => {
          Object.entries(data).forEach(([key, resource]) => {
            if (!Object.prototype.hasOwnProperty.call(subs, key)) {
              return;
            }

            Object.entries(resource).forEach(([action, value]) => {
              if (!Object.prototype.hasOwnProperty.call(subs[key], action)) {
                return;
              }

              subs[key][action as keyof SubscriptionState].subscribed = value;
            });
          });
          setSubscriptions(subs);
        })
        .catch(() => {
          push('Something went wrong when trying to fetch your subscription settings');
          setSubscriptions(subs);
        });
    } else {
      setSubscriptions(subs);
    }
  }, [definition, push, subscription]);

  const onSubscribeClick = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    event.preventDefault();

    if (subscription) {
      await unsubscribe();
      push({ body: formatMessage(messages.unsubscribeSuccess), color: 'info' });
      return;
    }

    if (window.Notification?.permission === 'denied') {
      push({ body: formatMessage(messages.blocked), color: 'warning' });
      return;
    }

    const result = await requestPermission();

    if (result !== 'granted') {
      push({ body: formatMessage(messages.permissionDenied), color: 'danger' });
      return;
    }

    try {
      await subscribe();
      push({ body: formatMessage(messages.subscribeSuccessful), color: 'success' });
    } catch (error) {
      push({ body: formatMessage(messages.subscribeError), color: 'danger' });
    }
  };

  const onSubscriptionChange = async (
    resource: string,
    action: keyof SubscriptionState,
    value: boolean,
  ): Promise<void> => {
    try {
      const { endpoint } = subscription;
      await axios.patch(`${settings.apiUrl}/api/apps/${settings.id}/subscriptions`, {
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
      push({ body: formatMessage(messages.subscribeError), color: 'danger' });
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
                  value={!!subscription}
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
                  {(Object.keys(resource) as (keyof SubscriptionState)[])
                    .filter(
                      (key) =>
                        resource[key].notification.subscribe === 'all' ||
                        resource[key].notification.subscribe === 'both',
                    )
                    .map((key) => (
                      <Checkbox
                        key={key}
                        className={styles.subscribeCheckbox}
                        disabled={!subscription || !resource.create}
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
