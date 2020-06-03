import { Icon, Loader, Message } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import useOrganizations from '../../../../hooks/useOrganizations';
import useUser from '../../../../hooks/useUser';
import checkRole from '../../../../utils/checkRole';
import HelmetIntl from '../../../HelmetIntl';
import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './index.css';
import messages from './messages';

export default function AppList(): React.ReactElement {
  const [filter, setFilter] = React.useState('');
  const organizations = useOrganizations();
  const [isLoading, setLoading] = React.useState(true);
  const [hasError, setError] = React.useState(false);
  const [apps, setApps] = React.useState<App[]>(null);

  const intl = useIntl();
  const { userInfo } = useUser();

  const onFilterChange = React.useCallback((event) => {
    setFilter(event.target.value);
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setApps(null);
    const url = userInfo ? '/api/apps/me' : '/api/apps';
    axios
      .get<App[]>(url)
      .then((r) => new Promise((resolve, reject) => setTimeout(reject, 1e3, r)))
      .then(({ data }) => setApps(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userInfo]);

  if (isLoading) {
    return <Loader />;
  }

  if (hasError) {
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
    checkRole(org.role, permissions.CreateApps),
  );

  return (
    <>
      <HelmetIntl title={messages.title} />
      <div className={`field ${styles.filter}`}>
        <p className="control has-icons-left">
          <input
            className="input"
            onChange={onFilterChange}
            placeholder={intl.formatMessage(messages.search)}
            value={filter}
          />
          <Icon className="is-left" icon="search" size="small" />
        </p>
      </div>
      <div className={styles.appList}>
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
        {createOrganizations.length >= 1 && <CreateAppCard />}
      </div>
      {userInfo && createOrganizations.length === 0 && apps.length === 0 && (
        <div className={styles.noApps}>
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
