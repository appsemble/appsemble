import {
  List,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import normalize from '../../utils/normalize';
import NavListItem from '../NavListItem';
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
    const {
      app,
    } = this.props;

    if (app == null) {
      return null;
    }

    return (
      <SideMenu>
        <nav>
          <List>
            {app.pages.map(page => (
              <NavListItem
                key={page.name}
                to={`/${normalize(page.name)}`}
              >
                {page.name}
              </NavListItem>
            ))}
          </List>
        </nav>
      </SideMenu>
    );
  }
}
