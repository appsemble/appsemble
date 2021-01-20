import { Button, useConfirmation } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils/src';
import axios from 'axios';
import React, { ReactElement, useCallback, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { checkRole } from '../../utils/checkRole';
import { useApp } from '../AppContext';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function AppScreenshots(): ReactElement {
  const { app, setApp } = useApp();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();

  const userRole = organizations?.find((org) => org.id === app.OrganizationId)?.role;
  const mayManageScreenshots = userRole && checkRole(userRole, Permission.EditAppSettings);

  const onDeleteScreenshotClick = useConfirmation({
    title: <FormattedMessage {...messages.deleteScreenshotTitle} />,
    body: <FormattedMessage {...messages.deleteScreenshotBody} />,
    cancelLabel: <FormattedMessage {...messages.deleteCancel} />,
    confirmLabel: <FormattedMessage {...messages.deleteConfirm} />,
    async action(url: string) {
      const split = url.split('/');
      const id = split[split.length - 1];

      await axios.delete(`/api/apps/${app.id}/screenshots/${id}`);
      setApp({ ...app, screenshotUrls: app.screenshotUrls.filter((u) => u !== url) });
    },
  });

  const screenshotDiv = useRef<HTMLDivElement>();
  const scrollScreenshots = useCallback((reverse = false) => {
    if (!screenshotDiv.current) {
      return;
    }

    screenshotDiv.current.scrollLeft += reverse ? -255 : 255;
  }, []);
  const scrollRight = useCallback(() => {
    scrollScreenshots();
  }, [scrollScreenshots]);
  const scrollLeft = useCallback(() => {
    scrollScreenshots(true);
  }, [scrollScreenshots]);

  return (
    <div className="my-4 is-flex">
      <Button
        className={`is-medium ${styles.scrollButton}`}
        icon="chevron-left"
        onClick={scrollLeft}
      />
      <div className={`px-4 ${styles.screenshots}`} ref={screenshotDiv}>
        {app.screenshotUrls.map((url) => (
          <div className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
            {mayManageScreenshots && (
              <Button
                className={`${styles.deleteScreenshotButton} mx-2 my-2 is-rounded is-small`}
                color="danger"
                icon="trash-alt"
                onClick={() => onDeleteScreenshotClick(url)}
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
        ))}
        {app.screenshotUrls.map((url) => (
          <figure className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
            <img
              alt={formatMessage(messages.screenshot, { app: app.definition.name })}
              className={styles.screenshot}
              src={url}
            />
          </figure>
        ))}
        {app.screenshotUrls.map((url) => (
          <figure className={`mr-6 ${styles.screenshotWrapper}`} key={url}>
            <img
              alt={formatMessage(messages.screenshot, { app: app.definition.name })}
              className={styles.screenshot}
              src={url}
            />
          </figure>
        ))}
      </div>
      <Button
        className={`is-medium ${styles.scrollButton}`}
        icon="chevron-right"
        onClick={scrollRight}
      />
    </div>
  );
}
