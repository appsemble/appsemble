import classNames from 'classnames';
import normalize from '@appsemble/utils/normalize';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink } from 'react-router-dom';

import SideMenu from '../SideMenu';
import messages from './messages';
import styles from './SideNavigation.css';

/**
 * The app navigation that is displayed in the side menu.
 */
export default class SideNavigation extends React.Component {
  static propTypes = {
    app: PropTypes.shape(),
    closeMenu: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
  };

  static defaultProps = {
    app: null,
  };

  onLogout = () => {
    const { closeMenu, logout } = this.props;

    logout();
    closeMenu();
  };

  render() {
    const { app } = this.props;

    if (app == null) {
      return null;
    }

    return (
      <SideMenu>
        <nav>
          <ul className={classNames('menu-list', styles.menuList)}>
            {app.pages
              .filter(page => !page.parameters)
              .map(page => (
                <li key={page.name}>
                  <NavLink activeClassName="is-active" to={`/${normalize(page.name)}`}>
                    {page.name}
                  </NavLink>
                </li>
              ))}
          </ul>
          <ul className="menu-list">
            <li>
              <button className={styles.logoutButton} onClick={this.onLogout} type="button">
                <FormattedMessage {...messages.logout} />
              </button>
            </li>
          </ul>
        </nav>
      </SideMenu>
    );
  }
}
