import { CheckboxField, FormComponent, Loader, useMessages } from '@appsemble/react-components';
import type { ResourceHooks, SubscriptionResponse } from '@appsemble/types';
import axios from 'axios';
import React, { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { apiUrl, appId } from '../../../utils/settings';
import { useAppDefinition } from '../../AppDefinitionProvider';
import { useServiceWorkerRegistration } from '../../ServiceWorkerRegistrationProvider';
import styles from './index.css';
import { messages } from './messages';

interface ResourceState {
  [resourceType: string]: SubscriptionState;
}

type ExtendedResourceHooks = ResourceHooks & { subscribed: boolean };

interface SubscriptionState {
  create?: ExtendedResourceHooks;
  update?: ExtendedResourceHooks;
  delete?: ExtendedResourceHooks;
}

export function AppSubscriptions(): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [subscriptions, setSubscriptions] = useState<ResourceState>();
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const { definition } = useAppDefinition();
  const {
    requestPermission,
    subscribe,
    subscription,
    unsubscribe,
  } = useServiceWorkerRegistration();

  useEffect(() => {
    const subs = Object.entries(definition.resources || {}).reduce<ResourceState>(
      (acc, [resourceType, resource]) => {
        Object.keys(resource)
          .filter((key) => ['create', 'update', 'delete'].includes(key))
          .forEach((key: keyof SubscriptionState) => {
            if (resource[key].hooks?.notification?.subscribe) {
              if (!Object.hasOwnProperty.call(acc, resourceType)) {
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
      setLoadingSubscriptions(true);
      const { endpoint } = subscription;
      axios
        .get<SubscriptionResponse>(`${apiUrl}/api/apps/${appId}/subscriptions`, {
          params: { endpoint },
        })
        .then(({ data }) => {
          Object.entries(data).forEach(([key, resource]) => {
            if (!Object.hasOwnProperty.call(subs, key)) {
              return;
            }

            Object.entries(resource).forEach(([action, value]) => {
              if (!Object.hasOwnProperty.call(subs[key], action)) {
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
        })
        .finally(() => setLoadingSubscriptions(false));
    } else {
      setSubscriptions(subs);
      setLoadingSubscriptions(false);
    }
  }, [definition, push, subscription]);

  const onSubscribeClick = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
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
    } catch {
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
      await axios.patch(`${apiUrl}/api/apps/${appId}/subscriptions`, {
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
    } catch {
      push({ body: formatMessage(messages.subscribeError), color: 'danger' });
    }
  };

  if (definition.notifications === undefined) {
    return null;
  }

  if (loadingSubscriptions) {
    return <Loader />;
  }

  return (
    <>
      <FormComponent label={<FormattedMessage {...messages.notifications} />} required>
        <div className={`${styles.setting} is-flex`}>
          <p className={styles.settingDescription}>
            <FormattedMessage {...messages.suscribeDescription} />
          </p>
          <CheckboxField
            className={styles.checkbox}
            name="subscribe"
            onChange={onSubscribeClick}
            switch
            title={<FormattedMessage {...messages.subscribe} />}
            value={Boolean(subscription)}
            wrapperClassName="is-flex"
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
                <CheckboxField
                  className={styles.subscribeCheckbox}
                  disabled={!subscription || !resource.create}
                  key={key}
                  name={`${resourceType}.${key}`}
                  onChange={(_, value) => onSubscriptionChange(resourceType, key, value)}
                  switch
                  title={
                    <FormattedMessage
                      {...messages.subscriptionLabel}
                      values={{
                        resource: resourceType,
                        actionVerb: <FormattedMessage {...messages[key]} />,
                      }}
                    />
                  }
                  value={subscriptions[resourceType][key].subscribed}
                />
              ))}
          </FormComponent>
        ))}
      </FormComponent>
    </>
  );
}
