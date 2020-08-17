import { Button, Content, Subtitle, Title, useData, useToggle } from '@appsemble/react-components';
import type { Organization } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { checkRole } from '../../utils/checkRole';
import { getAppUrl } from '../../utils/getAppUrl';
import { useApp } from '../AppContext';
import { AppRatings } from '../AppRatings';
import { StarRating } from '../StarRating';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function AppDetails(): ReactElement {
  const { app } = useApp();
  const { data: organization, error, loading } = useData<Organization>(
    `/api/organizations/${app.OrganizationId}`,
  );
  const cloneDialog = useToggle();
  const { formatMessage } = useIntl();

  const { organizations } = useUser();

  const createOrganizations =
    organizations.filter((org) => checkRole(org.role, Permission.CreateApps)) || [];

  return (
    <Content className={styles.root}>
      <div className="is-flex">
        <figure className={`image ${styles.icon}`}>
          <img alt={formatMessage(messages.appLogo)} src={`/api/apps/${app.id}/icon`} />
        </figure>
        <div className={`mx-2 ${styles.appMeta}`}>
          <header>
            <Title className="is-marginless" level={1}>
              {app.definition.name}
            </Title>
            <Subtitle className="is-marginless" level={3}>
              {loading || error ? `@${app.OrganizationId}` : organization.name}
            </Subtitle>
          </header>
          {app.definition.description && <p>{app.definition.description}</p>}
          <StarRating className="is-inline" count={app.rating.count} value={app.rating.average} />
        </div>
        <div className={`is-flex ${styles.buttonContainer}`}>
          <a
            className="button is-primary"
            href={getAppUrl(app.OrganizationId, app.path, app.domain)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <FormattedMessage {...messages.view} />
          </a>
          {createOrganizations.length > 0 && (
            <Button className="mt-3" onClick={cloneDialog.enable}>
              <FormattedMessage {...messages.clone} />
            </Button>
          )}
        </div>
      </div>
      <AppRatings />
    </Content>
  );
}
