import { Icon } from '@appsemble/react-components';
import { type App } from '@appsemble/types';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface AppIconProps {
  /**
   * The app whose icon to render.
   */
  readonly app: App;
}

/**
 * Render the icon of an app.
 *
 * If the app has no icon, a FontAwesome icon is rendered as a fallback, using the app’s icon
 * background.
 */
export function AppIcon({ app }: AppIconProps): ReactElement {
  const { formatMessage } = useIntl();

  if (app.iconUrl) {
    return (
      <img
        alt={formatMessage(messages.alt, { appName: app.definition.name })}
        className="is-rounded card"
        src={app.iconUrl}
      />
    );
  }

  return (
    <Icon
      className={`${styles.fallback} card`}
      icon="mobile-alt"
      style={{ backgroundColor: app.iconBackground }}
    />
  );
}
