import { Icon, Loader, Message, useData } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import checkRole from '../../utils/checkRole';
import HelmetIntl from '../HelmetIntl';
import { useOrganizations } from '../OrganizationsProvider';
import { useUser } from '../UserProvider';
import AppCard from './components/AppCard';
import CreateAppCard from './components/CreateAppCard';
import styles from './index.css';
import messages from './messages';

export default function AppList(): ReactElement {
  const [filter, setFilter] = useState('');
  const organizations = useOrganizations();
  const { formatMessage } = useIntl();
  const { userInfo } = useUser();
  const { data: apps, error, loading } = useData<App[]>(userInfo ? '/api/apps/me' : '/api/apps');

  const onFilterChange = useCallback((event) => {
    setFilter(event.target.value);
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  const filteredApps = apps.filter((app) =>
    app.definition.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const createOrganizations = organizations.filter((org) =>
    checkRole(org.role, Permission.CreateApps),
  );

  return (
    <>
      <HelmetIntl title={messages.title} />
      <div className={`field ${styles.filter}`}>
        <p className="control has-icons-left">
          <input
            className="input"
            onChange={onFilterChange}
            placeholder={formatMessage(messages.search)}
            value={filter}
          />
          <Icon className="is-left" icon="search" size="small" />
        </p>
      </div>
      <div className={`${styles.appList} px-3 py-3`}>
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
        {createOrganizations.length >= 1 && <CreateAppCard />}
      </div>
      {userInfo && createOrganizations.length === 0 && apps.length === 0 && (
        <div className={`${styles.noApps} px-4 py-4 has-text-centered`}>
          <span>
            <i className={`fas fa-folder-open ${styles.noAppsIcon}`} />
          </span>
          <span>
            <FormattedMessage
              {...messages.createOrganizationInstruction}
              values={{
                link: (
                  <Link to="/settings/organizations">
                    <FormattedMessage {...messages.here} />
                  </Link>
                ),
              }}
            />
          </span>
        </div>
      )}
    </>
  );
}
