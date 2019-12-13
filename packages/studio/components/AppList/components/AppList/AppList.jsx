import { Icon, Loader } from '@appsemble/react-components';
import { permissions } from '@appsemble/utils';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import useUser from '../../../../hooks/useUser';
import checkRole from '../../../../utils/checkRole';
import HelmetIntl from '../../../HelmetIntl';
import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';
import messages from './messages';

export default function AppList({ apps, getApps, getPublicApps }) {
  const intl = useIntl();
  const [filter, setFilter] = React.useState('');
  const [organizations, setOrganizations] = React.useState([]);
  const { userInfo } = useUser();

  const onFilterChange = React.useCallback(event => {
    setFilter(event.target.value);
  }, []);

  React.useEffect(() => {
    if (userInfo) {
      getApps();
    } else {
      getPublicApps();
    }
  }, [getApps, getPublicApps, userInfo]);

  React.useEffect(() => {
    const fetchOrganizations = async () => {
      const { data } = await axios.get('/api/user/organizations');
      setOrganizations(data);
    };

    if (userInfo) {
      fetchOrganizations();
    }
  }, [userInfo]);

  if (!apps) {
    return <Loader />;
  }

  const filteredApps = apps.filter(app =>
    app.definition.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const createOrganizations = organizations.filter(org =>
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
        {filteredApps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
        {createOrganizations.length >= 1 && <CreateAppCard />}
      </div>
      {createOrganizations.length === 0 && apps.length === 0 && (
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

AppList.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  getApps: PropTypes.func.isRequired,
  getPublicApps: PropTypes.func.isRequired,
};
