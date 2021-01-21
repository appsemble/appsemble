import { Button, useConfirmation } from '@appsemble/react-components';
import axios from 'axios';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../../AppContext';
import styles from './index.css';
import { messages } from './messages';

interface AppScreenshotProps {
  url: string;
  mayManageScreenshots: boolean;
}
export function AppScreenshot({ mayManageScreenshots, url }: AppScreenshotProps): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();

  const onDeleteScreenshotClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteScreenshotTitle} />,
    body: <FormattedMessage {...messages.deleteScreenshotBody} />,
    cancelLabel: <FormattedMessage {...messages.deleteCancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteConfirm} />,
    async action() {
      const split = url.split('/');
      const id = split[split.length - 1];

      await axios.delete(`/api/apps/${app.id}/screenshots/${id}`);
      setApp({ ...app, screenshotUrls: app.screenshotUrls.filter((u) => u !== url) });
    },
  });

  return (
    <div className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
      {mayManageScreenshots && (
        <Button
          className={`${styles.deleteScreenshotButton} mx-2 my-2 is-rounded is-small`}
          color="danger"
          icon="trash-alt"
          onClick={onDeleteScreenshotClick}
        />
      )}
      <figure className={styles.screenshot}>
        <img
          alt={formatMessage(messages.screenshot, { app: app.definition.name })}
          className={styles.screenshot}
          src={url}
        />
      </figure>
    </div>
  );
}
