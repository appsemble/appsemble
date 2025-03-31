import { CheckboxField, FormComponent, Loader, useMessages } from '@appsemble/react-components';
import {
  type ResourceHooks,
  resourceSubscribableAction,
  type SubscriptionResponse,
} from '@appsemble/types';
import { has } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { apiUrl, appId } from '../../../utils/settings.js';
import { useAppDefinition } from '../../AppDefinitionProvider/index.js';
import { useServiceWorkerRegistration } from '../../ServiceWorkerRegistrationProvider/index.js';

type ResourceState = Record<string, SubscriptionState>;

type ExtendedResourceHooks = ResourceHooks & { subscribed: boolean };

interface SubscriptionState {
  create?: ExtendedResourceHooks;
  update?: ExtendedResourceHooks;
  delete?: ExtendedResourceHooks;
}

export function AppSubscriptions(): ReactNode {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const [subscriptions, setSubscriptions] = useState<ResourceState>();
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const { definition } = useAppDefinition();
  const { requestPermission, subscribe, subscription, unsubscribe } =
    useServiceWorkerRegistration();

  useEffect(() => {
    const subs: ResourceState = {};
    if (definition.resources) {
      for (const [resourceType, resource] of Object.entries(definition.resources)) {
        for (const key of Object.keys(resource)) {
          if (
            (key === 'create' || key === 'update' || key === 'delete') &&
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            resource[key].hooks?.notification?.subscribe
          ) {
            if (!has(subs, resourceType)) {
              subs[resourceType] = {};
            }
            // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
            subs[resourceType][key] = { ...resource[key].hooks, subscribed: false };
          }
        }
      }
    }

    if (subscription) {
      setLoadingSubscriptions(true);
      const { endpoint } = subscription;
      axios
        .get<SubscriptionResponse>(`${apiUrl}/api/apps/${appId}/subscriptions`, {
          params: { endpoint },
        })
        .then(({ data }) => {
          for (const [key, resource] of Object.entries(data)) {
            if (!has(subs, key)) {
              continue;
            }

            for (const [action, value] of Object.entries(resource)) {
              if (!has(subs[key], action)) {
                continue;
              }

              // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
              subs[key][action as keyof SubscriptionState].subscribed = value;
            }
          }
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
      // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
      const resourceActionsToSubscribeTo = Object.entries(subscriptions).flatMap(
        ([resourceType, subscriptionState]) =>
          resourceSubscribableAction
            .filter(
              (action) =>
                subscriptionState[action]?.notification?.subscribe === 'all' ||
                subscriptionState[action]?.notification?.subscribe === 'both',
            )
            .map((action) => ({ resourceType, action })),
      );

      await subscribe(resourceActionsToSubscribeTo);
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
          // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
          ...subscriptions[resource],
          // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
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
            <FormattedMessage {...messages.subscribeDescription} />
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
        {Object.entries(subscriptions ?? {}).map(([resourceType, resource]) => (
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
            {resource.create?.notification?.subscribe === 'all' ||
            resource.create?.notification?.subscribe === 'both' ? (
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
                // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
                value={subscriptions[resourceType].create.subscribed}
              />
            ) : null}
            {resource.update?.notification?.subscribe === 'all' ||
            resource.update?.notification?.subscribe === 'both' ? (
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
                // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
                value={subscriptions[resourceType].update.subscribed}
              />
            ) : null}
            {resource.delete?.notification?.subscribe === 'all' ||
            resource.delete?.notification?.subscribe === 'both' ? (
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
                // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
                value={subscriptions[resourceType].update.subscribed}
              />
            ) : null}
          </FormComponent>
        ))}
      </FormComponent>
    </>
  );
}
