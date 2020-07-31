import { Content, Input, Loader, Message, Select, useData } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import React, { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import checkRole from '../../utils/checkRole';
import HelmetIntl from '../HelmetIntl';
import { useUser } from '../UserProvider';
import AppCard from './components/AppCard';
import CreateAppButton from './components/CreateAppButton';
import styles from './index.css';
import messages from './messages';

export default function AppList(): ReactElement {
  const [filter, setFilter] = useState('');
  const { formatMessage } = useIntl();
  const { organizations, userInfo } = useUser();
  const { data: apps, error, loading, setData: setApps } = useData<App[]>(
    userInfo ? '/api/apps/me' : '/api/apps',
  );

  const onFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.currentTarget.value);
  }, []);

  const onSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.currentTarget;
      const sortedApps = [...apps];

      const [name, direction] = value.split('.');

      switch (name) {
        case 'organization':
          sortedApps.sort((a, b) => a.OrganizationId.localeCompare(b.OrganizationId));
          break;

        case 'rating':
          // Sort by average, then by count
          sortedApps.sort((a, b) =>
            a.rating.average === b.rating.average
              ? a.rating.count - b.rating.count
              : a.rating.average - b.rating.average,
          );
          break;

        case '$updated':
        case '$created':
          sortedApps.sort((a, b) => new Date(a[name]).getDate() - new Date(b[name]).getDate());
          break;

        case 'name':
          sortedApps.sort((a, b) => a.definition.name.localeCompare(b.definition.name));
          break;

        default:
          break;
      }

      setApps(direction === 'desc' ? sortedApps.reverse() : sortedApps);
    },
    [apps, setApps],
  );

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

  const filteredApps = apps.filter(
    (app) =>
      app.definition.name.toLowerCase().includes(filter.toLowerCase()) ||
      app.OrganizationId.toLowerCase().includes(filter.toLowerCase()),
  );

  const createOrganizations = organizations.filter((org) =>
    checkRole(org.role, Permission.CreateApps),
  );

  return (
    <>
      <HelmetIntl title={messages.title} />
      <Content className={styles.content} padding>
        <div className={`is-flex ${styles.actions}`}>
          <Input
            iconLeft="search"
            name="search"
            onChange={onFilterChange}
            placeholder={formatMessage(messages.search)}
            wrapperClassName="mr-4 mb-0"
          />
          <Select className="mb-0" icon="sort" name="sort" onChange={onSortChange}>
            <option hidden>{formatMessage(messages.sort)}</option>
            <option value="rating.asc">
              {`${formatMessage(messages.ratings)} (${formatMessage(messages.ascending)})`}
            </option>
            <option value="rating.desc">
              {`${formatMessage(messages.ratings)} (${formatMessage(messages.descending)})`}
            </option>
            <option value="name.asc">
              {`${formatMessage(messages.name)} (${formatMessage(messages.ascending)})`}
            </option>
            <option value="name.desc">
              {`${formatMessage(messages.name)} (${formatMessage(messages.descending)})`}
            </option>
            <option value="organization.asc">
              {`${formatMessage(messages.organization)} (${formatMessage(messages.ascending)})`}
            </option>
            <option value="organization.desc">
              {`${formatMessage(messages.organization)} (${formatMessage(messages.descending)})`}
            </option>
            <option value="$created.asc">
              {`${formatMessage(messages.created)} (${formatMessage(messages.ascending)})`}
            </option>
            <option value="$created.desc">
              {`${formatMessage(messages.created)} (${formatMessage(messages.descending)})`}
            </option>
            <option value="$updated.asc">
              {`${formatMessage(messages.updated)} (${formatMessage(messages.ascending)})`}
            </option>
            <option value="$updated.desc">
              {`${formatMessage(messages.updated)} (${formatMessage(messages.descending)})`}
            </option>
          </Select>
          {createOrganizations.length >= 1 && (
            <CreateAppButton className={styles.createAppButton} />
          )}
        </div>

        <div className={`${styles.appList}`}>
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
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
      </Content>
    </>
  );
}
