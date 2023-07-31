import { Button, Modal, useConfirmation, useToggle } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../index.js';

interface AppScreenshotProps {
  readonly url: string;
  readonly mayManageScreenshots: boolean;
}
export function AppScreenshot({ mayManageScreenshots, url }: AppScreenshotProps): ReactElement {
  const { app, setApp } = useApp();
  const { formatMessage } = useIntl();
  const modal = useToggle();

  const onDeleteScreenshotClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteScreenshotTitle} />,
    body: <FormattedMessage {...messages.deleteScreenshotBody} />,
    cancelLabel: <FormattedMessage {...messages.deleteCancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteConfirm} />,
    async action() {
      const split = url.split('/');
      const id = split.at(-1);

      await axios.delete(`/api/apps/${app.id}/screenshots/${id}`);
      setApp({ ...app, screenshotUrls: app.screenshotUrls.filter((u) => u !== url) });
    },
  });

  return (
    <div className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
      {mayManageScreenshots ? (
        <Button
          className={`${styles.deleteScreenshotButton} mx-2 my-2 is-rounded is-small`}
          color="danger"
          icon="trash-alt"
          onClick={onDeleteScreenshotClick}
        />
      ) : null}
      <button
        className={`${styles.button} ${styles.screenshot}`}
        onClick={modal.enable}
        type="button"
      >
        <figure className={styles.screenshot}>
          <img
            alt={formatMessage(messages.screenshot, { app: app.definition.name })}
            className={styles.screenshot}
            src={url}
          />
        </figure>
      </button>
      <Modal isActive={modal.enabled} onClose={modal.disable}>
        <figure className="image">
          <img alt={formatMessage(messages.screenshot, { app: app.definition.name })} src={url} />
        </figure>
      </Modal>
    </div>
  );
}
