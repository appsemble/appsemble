import { MenuList } from '@appsemble/react-bulma';
import normalize from '@appsemble/utils/normalize';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink } from 'react-router-dom';

import SideMenu from '../SideMenu';

/**
 * The app navigation that is displayed in the side menu.
 */
export default class SideNavigation extends React.Component {
  static propTypes = {
    app: PropTypes.shape(),
  };

  static defaultProps = {
    app: null,
  };

  render() {
    const { app } = this.props;

    if (app == null) {
      return null;
    }

    return (
      <SideMenu>
        <nav>
          <MenuList>
            {app.pages.filter(page => !page.parameters).map(page => (
              <li key={page.name}>
                <NavLink to={`/${normalize(page.name)}`}>{page.name}</NavLink>
              </li>
            ))}
          </MenuList>
        </nav>
      </SideMenu>
    );
  }
}
