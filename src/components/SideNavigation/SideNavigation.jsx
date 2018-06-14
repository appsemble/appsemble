import {
  List,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import normalize from '../../utils/normalize';
import NavListItem from '../NavListItem';
import SideMenu from '../SideMenu';


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
              <NavListItem to={`/${normalize(page.name)}`}>
                {page.name}
              </NavListItem>
            ))}
          </List>
        </nav>
      </SideMenu>
    );
  }
}
