import React from 'react';
import PropTypes from 'prop-types';

import NavLink from '../NavLink';
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
            <NavLink exact to={match.url}>
              Resources
            </NavLink>
            {app.resources && (
              <ul>
                {Object.keys(app.resources)
                  .sort()
                  .map(resource => (
                    <li key={resource}>
                      <NavLink to={`${match.url}/${resource}`}>{resource}</NavLink>
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
