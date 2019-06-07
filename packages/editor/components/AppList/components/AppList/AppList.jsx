import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';

import HelmetIntl from '../../../HelmetIntl';
import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import styles from './AppList.css';
import messages from './messages';

export default class AppList extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    getApps: PropTypes.func.isRequired,
  };

  async componentDidMount() {
    const { getApps } = this.props;
    getApps();
  }

  render() {
    const { apps } = this.props;

    if (!apps) {
      return <Loader />;
    }

    return (
      <div className={styles.appList}>
        <HelmetIntl title={messages.title} />

        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
        <CreateAppCard />
      </div>
    );
  }
}
