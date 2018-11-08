import axios from 'axios';
import React from 'react';

import AppCard from '../AppCard';
import styles from './applist.css';

export default class AppList extends React.Component {
  state = {
    apps: [],
  };

  async componentDidMount() {
    const { data: apps } = await axios.get(`/api/apps/`);
    this.setState({ apps });
  }

  render() {
    const { apps } = this.state;
    if (!apps) {
      return <p>Loading...</p>;
    }

    if (!apps.length) {
      return <p>No apps!</p>;
    }

    return (
      <div className={styles.appList}>
        {apps.map(app => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    );
  }
}
