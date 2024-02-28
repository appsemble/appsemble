import { Button, Title, useToggle } from '@appsemble/react-components';
import { defaultLocale } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { AppRatings } from './AppRatings/index.js';
import { AppScreenshots } from './AppScreenshots/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { AppIcon } from '../../../../components/AppIcon/index.js';
import { AppOptionsMenu } from '../../../../components/AppOptionsMenu/index.js';
import { CardHeaderControl } from '../../../../components/CardHeaderControl/index.js';
import { CloneButton } from '../../../../components/CloneButton/index.js';
import { MarkdownContent } from '../../../../components/MarkdownContent/index.js';
import { ReseedButton } from '../../../../components/ReseedButton/index.js';
import { StarRating } from '../../../../components/StarRating/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';
import { getAppUrl } from '../../../../utils/getAppUrl.js';
import { useApp } from '../index.js';

/**
 * Display a more detailed overview of an individual app.
 */
export function IndexPage(): ReactNode {
  const { app } = useApp();
  const { organizations } = useUser();
  const descriptionToggle = useToggle();
  const [checked, setChecked] = useState(false);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;

  const appLang = app.definition.defaultLanguage || defaultLocale;

  const onChecked = useCallback(() => {
    setChecked((prevChecked) => !prevChecked);
  }, []);

  const onExport = useCallback(async () => {
    const response = await axios.get(`/api/apps/${app.id}/export?resources=${checkedRef.current}`, {
      responseType: 'blob',
    });
    const url = document.createElement('a');
    url.href = URL.createObjectURL(response.data);
    url.download = `${app.definition.name}_${app.id}.zip`;

    url.click();
  }, [app.id, app.definition.name]);

  const showExport = organizations.some((organization) => organization.id === app.OrganizationId);
  const showExportResources = organizations.some(
    (organization) => organization.id === app.OrganizationId && organization.role >= 'AppEditor',
  );

  return (
    <main>
      <CardHeaderControl
        controls={
          <>
            <Button
              className="mb-3 ml-4"
              color="primary"
              component="a"
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </Button>
            <CloneButton app={app} />
            <ReseedButton app={app} />
            {showExport ? (
              <AppOptionsMenu
                app={app}
                checked={checked}
                onChecked={onChecked}
                onExport={onExport}
                showExport={showExport}
                showExportResources={showExportResources}
              />
            ) : null}
          </>
        }
        description={app.messages?.app?.description || app.definition.description}
        details={
          <StarRating
            className="is-inline"
            count={app.rating?.count ?? 0}
            value={app.rating?.average ?? 0}
          />
        }
        icon={<AppIcon app={app} />}
        subtitle={
          <Link to={`../../../organizations/${app.OrganizationId}`}>
            {app.OrganizationName || app.OrganizationId}
          </Link>
        }
        title={
          <>
            {app.messages?.app?.name || app.definition.name}
            {app.demoMode ? (
              <div className="tag is-danger ml-2">
                <FormattedMessage {...messages.demo} />
              </div>
            ) : null}
          </>
        }
      >
        <AppScreenshots />
      </CardHeaderControl>
      {app.longDescription ? (
        <div
          className={classNames('card my-3 card-content', {
            [styles.descriptionHidden]: !descriptionToggle.enabled,
          })}
        >
          <Title>
            <FormattedMessage {...messages.description} />
          </Title>
          <Button className={styles.descriptionToggle} onClick={descriptionToggle.toggle}>
            {descriptionToggle.enabled ? (
              <FormattedMessage {...messages.readLess} />
            ) : (
              <FormattedMessage {...messages.readMore} />
            )}
          </Button>
          <MarkdownContent content={app.longDescription} lang={appLang} />
          <br />
        </div>
      ) : null}
      <AppRatings />
    </main>
  );
}
