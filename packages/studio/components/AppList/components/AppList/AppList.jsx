import { Icon, Loader } from '@appsemble/react-components';
import { permissions } from '@appsemble/utils/constants/roles';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import checkRole from '../../../../utils/checkRole';
import HelmetIntl from '../../../HelmetIntl';
import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';
import messages from './messages';

export default class AppList extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    getApps: PropTypes.func.isRequired,
    getPublicApps: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: undefined,
  };

  state = { filter: '', organizations: undefined };

  async componentDidMount() {
    const { getApps, getPublicApps, user } = this.props;

    if (user) {
      getApps();
      const { data: organizations } = await axios.get('/api/user/organizations');
      this.setState({ organizations });
    } else {
      getPublicApps();
    }
  }

  onFilterChange = event => {
    this.setState({ filter: event.target.value });
  };

  render() {
    const { apps, intl, user } = this.props;
    const { filter, organizations } = this.state;

    if (!apps || organizations === undefined) {
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
              onChange={this.onFilterChange}
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
          {user && createOrganizations.length && (
            <CreateAppCard organizations={createOrganizations} />
          )}
        </div>
        {user && organizations.length === 0 && apps.length === 0 && (
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
}
