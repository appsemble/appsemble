import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';
import messages from './messages';

export default class AppList extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    getApps: PropTypes.func.isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: undefined,
  };

  async componentDidMount() {
    const { getApps } = this.props;
    getApps();
  }

  render() {
    const { apps, user } = this.props;

    if (!apps) {
      return <Loader />;
    }

    return (
      <React.Fragment>
        <div className={styles.appList}>
          {apps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
          {user && user.organizations.length > 1 && <CreateAppCard />}
        </div>
        {user && user.organizations.length === 0 && apps.length === 0 && (
          <div className={styles.noApps}>
            <span>
              <i className={`fas fa-folder-open ${styles.noAppsIcon}`} />
            </span>
            <span>
              <FormattedMessage
                {...messages.createOrganizationInstruction}
                values={{
                  link: (
                    <Link to="/_/settings/organizations">
                      <FormattedMessage {...messages.here} />
                    </Link>
                  ),
                }}
              />
            </span>
          </div>
        )}
      </React.Fragment>
    );
  }
}
