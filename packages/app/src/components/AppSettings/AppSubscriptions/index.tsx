import { CheckboxField, FormComponent, Loader, useMessages } from '@appsemble/react-components';
import { ResourceHooks, SubscriptionResponse } from '@appsemble/types';
import axios from 'axios';
import { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { apiUrl, appId } from '../../../utils/settings';
import { useAppDefinition } from '../../AppDefinitionProvider';
import { useServiceWorkerRegistration } from '../../ServiceWorkerRegistrationProvider';
import styles from './index.module.css';
import { messages } from './messages';

type ResourceState = Record<string, SubscriptionState>;

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
  const { requestPermission, subscribe, subscription, unsubscribe } =
    useServiceWorkerRegistration();

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
            {(resource.create?.notification?.subscribe === 'all' ||
              resource.create?.notification?.subscribe === 'both') && (
              <CheckboxField
                className={styles.subscribeCheckbox}
                disabled={!subscription || !resource.create}
                name={`${resourceType}.create`}
                onChange={(event, value) => onSubscriptionChange(resourceType, 'create', value)}
                switch
                title={
                  <FormattedMessage
                    {...messages.createSubscriptionLabel}
                    values={{
                      resource: resourceType,
                    }}
                  />
                }
                value={subscriptions[resourceType].create.subscribed}
              />
            )}
            {(resource.update?.notification?.subscribe === 'all' ||
              resource.update?.notification?.subscribe === 'both') && (
              <CheckboxField
                className={styles.subscribeCheckbox}
                disabled={!subscription || !resource.update}
                name={`${resourceType}.update`}
                onChange={(event, value) => onSubscriptionChange(resourceType, 'update', value)}
                switch
                title={
                  <FormattedMessage
                    {...messages.updateSubscriptionLabel}
                    values={{
                      resource: resourceType,
                    }}
                  />
                }
                value={subscriptions[resourceType].update.subscribed}
              />
            )}
            {(resource.delete?.notification?.subscribe === 'all' ||
              resource.delete?.notification?.subscribe === 'both') && (
              <CheckboxField
                className={styles.subscribeCheckbox}
                disabled={!subscription || !resource.delete}
                name={`${resourceType}.delete`}
                onChange={(event, value) => onSubscriptionChange(resourceType, 'delete', value)}
                switch
                title={
                  <FormattedMessage
                    {...messages.deleteSubscriptionLabel}
                    values={{
                      resource: resourceType,
                    }}
                  />
                }
                value={subscriptions[resourceType].update.subscribed}
              />
            )}
          </FormComponent>
        ))}
      </FormComponent>
    </>
  );
}
