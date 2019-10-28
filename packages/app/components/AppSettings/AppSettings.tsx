import { Checkbox, FormComponent } from '@appsemble/react-components';
import { Message } from '@appsemble/sdk';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';

import { Permission } from '../../actions/serviceWorker';
import TitleBar from '../TitleBar';
import styles from './AppSettings.css';
import messages from './messages';

export interface AppSettingsProps {
  permission: Permission;
  subscribed: boolean;
  requestPermission: () => Promise<Permission>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  push: (message: Message) => void;
}

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function AppSettings({
  requestPermission,
  subscribe,
  unsubscribe,
  subscribed,
  permission,
  intl,
  push,
}: AppSettingsProps & WrappedComponentProps): React.ReactElement {
  const onSubscribeClick = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    event.preventDefault();
    if (!subscribed) {
      if (window.Notification && window.Notification.permission === 'denied') {
        push({ body: intl.formatMessage(messages.blocked), color: 'warning' });
        return;
      }

      const result = await requestPermission();
      if (result === 'granted') {
        try {
          await subscribe();
          push({ body: intl.formatMessage(messages.subscribeSuccessful), color: 'success' });
        } catch (error) {
          push({ body: intl.formatMessage(messages.subscribeError), color: 'danger' });
        }
      } else {
        push({ body: intl.formatMessage(messages.permissionDenied), color: 'danger' });
      }
    } else {
      await unsubscribe();
      push({ body: intl.formatMessage(messages.unsubscribeSuccess), color: 'info' });
    }
  };

  return (
    <>
      <TitleBar>
        <FormattedMessage {...messages.settings} />
      </TitleBar>
      {permission === 'pending' && <div className={`modal-background ${styles.overlay}`} />}
      <div className={styles.root}>
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
              value={subscribed}
            />
          </div>
        </FormComponent>
      </div>
    </>
  );
}
