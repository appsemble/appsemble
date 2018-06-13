import {
  AppBar,
  Toolbar,
  Typography,
} from '@material-ui/core';
import React from 'react';

import SideMenuButton from '../SideMenuButton';


export default class TitleBar extends React.Component {
  render() {
    return (
      <AppBar>
        <Toolbar>
          <SideMenuButton />
          <Typography variant="title" color="inherit">
            Appsemble
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}
