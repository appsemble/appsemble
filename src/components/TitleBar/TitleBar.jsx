import {
  AppBar,
  Toolbar,
  Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import SideMenuButton from '../SideMenuButton';


/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export default class TitleBar extends React.Component {
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

    return (
      <AppBar>
        <Toolbar>
          <SideMenuButton />
          <Typography variant="title" color="inherit">
            {/* eslint-disable-next-line no-restricted-globals */}
            {app?.name || 'Appsemble'}
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}
