import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';

import AppCard from '../AppCard';
import AppIcon from '../AppIcon';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';

export default class AppList extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    getApps: PropTypes.func.isRequired,
    getPublicApps: PropTypes.func.isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
  };

  async componentDidMount() {
    const { getApps, getPublicApps, isLoggedIn } = this.props;

    if (isLoggedIn) {
      getApps();
    } else {
      getPublicApps();
    }
  }

  render() {
    const { apps, isLoggedIn } = this.props;

    if (!apps) {
      return <Loader />;
    }

    const Component = isLoggedIn ? AppCard : AppIcon;
    const style = isLoggedIn ? styles.appList : styles.appIcons;

    return (
      <div className={style}>
        {apps.map(app => (
          <Component key={app.id} app={app} />
        ))}
        {isLoggedIn && <CreateAppCard />}
      </div>
    );
  }
}
