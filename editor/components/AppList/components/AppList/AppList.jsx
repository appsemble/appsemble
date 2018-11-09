import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import AppCard from '../AppCard';
import CreateAppCard from '../CreateAppCard';
import messages from './messages';
import styles from './applist.css';

export default class AppList extends React.Component {
  async componentDidMount() {
    const { getApps } = this.props;
    getApps();
  }

  render() {
    const { apps, history } = this.props;
    if (!apps) {
      return (
        <p>
          <FormattedMessage {...messages.loading} />
        </p>
      );
    }

    return (
      <div className={styles.appList}>
        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
        <CreateAppCard history={history} />
      </div>
    );
  }
}
