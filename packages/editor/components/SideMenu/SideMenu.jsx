import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import NavLink from '../NavLink';
import styles from './SideMenu.css';
import messages from './messages';

export default class SideMenu extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
  };

  state = {
    isCollapsed: false,
  };

  render() {
    const { app, match } = this.props;
    const { isCollapsed } = this.state;

    return (
      <div className={classNames({ [styles.collapsed]: isCollapsed }, styles.sideMenuContainer)}>
        <aside className={classNames('menu', styles.sideMenu)}>
          <ul className="menu-list">
            <li>
              <NavLink className={styles.menuItem} exact to={`${match.url}/edit`}>
                <span className="icon is-medium">
                  <i className="fas fa-lg fa-edit" />
                </span>
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.editor} />
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                className={styles.menuItem}
                exact={!isCollapsed}
                to={`${match.url}/resources`}
              >
                <span className="icon is-medium">
                  <i className="fas fa-lg fa-cubes" />
                </span>
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.resources} />
                </span>
              </NavLink>
              {app.resources && !isCollapsed && (
                <ul>
                  {Object.keys(app.resources)
                    .sort()
                    .map(resource => (
                      <li key={resource}>
                        <NavLink
                          className={styles.menuItem}
                          to={`${match.url}/resources/${resource}`}
                        >
                          {resource}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          </ul>
          <button
            className={`button ${styles.collapseButton}`}
            onClick={() => this.setState({ isCollapsed: !isCollapsed })}
            type="button"
          >
            <span className="icon is-medium">
              <i
                className={`fas fa-lg ${classNames({
                  'fa-angle-double-left': !isCollapsed,
                  'fa-angle-double-right': isCollapsed,
                })}`}
              />
            </span>
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.collapse} />
            </span>
          </button>
        </aside>
      </div>
    );
  }
}
