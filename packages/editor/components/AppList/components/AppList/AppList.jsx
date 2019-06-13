import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';

import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';

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
      <div className={styles.appList}>
        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
        {user && user.organizations.length > 1 && <CreateAppCard />}
      </div>
    );
  }
}
