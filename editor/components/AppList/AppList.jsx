import axios from 'axios';
import React from 'react';

import styles from './applist.css';

function chunkArray(items, chunk_size) {
  const results = [];

  while (items.length) {
    results.push(items.splice(0, chunk_size));
  }

  return results;
}

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
      return <div>Loading...</div>;
    }

    const f = apps.map(app => (
      <div key={app.id} className="tile is-parent is-4">
        <article className="tile is-child box">
          <figure className="image is-64x64">
            <img alt="Logo" src={`/${app.id}/icon-64.png`} />
          </figure>
          <a href={`/editor/${app.id}`}>{app.name}</a>
        </article>
      </div>
    ));

    return chunkArray(f, 3).map(chunk => <div className="tile is-ancestor">{chunk}</div>);
  }
}
