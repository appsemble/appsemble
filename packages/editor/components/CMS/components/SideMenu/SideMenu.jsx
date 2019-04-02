import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import styles from './SideMenu.css';

export default class SideMenu extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
  };

  render() {
    const { app } = this.props;

    return (
      <aside className={`menu ${styles.sideMenu}`}>
        <p className="menu-label">General</p>
        <ul className="menu-list">
          <li>
            <p>Resources</p>
            {app.resources && (
              <ul>
                {Object.keys(app.resources).map(resource => (
                  <li>
                    <Link to={resource}>{resource}</Link>
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
