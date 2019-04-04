import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import styles from './SideMenu.css';

export default class SideMenu extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  render() {
    const { app, match } = this.props;

    return (
      <aside className={`menu ${styles.sideMenu}`}>
        <p className="menu-label">General</p>
        <ul className="menu-list">
          <li>
            <Link
              className={match.params.resourceName ? undefined : 'is-active'}
              to={match.url.replace(`/${match.params.resourceName}`, '')}
            >
              Resources
            </Link>
            {app.resources && (
              <ul>
                {Object.keys(app.resources).map(resource => (
                  <li key={resource}>
                    <Link
                      className={
                        match.params.resourceName && match.params.resourceName === resource
                          ? 'is-active'
                          : undefined
                      }
                      to={`${match.url}/${resource}`}
                    >
                      {resource}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </aside>
    );
  }
}
