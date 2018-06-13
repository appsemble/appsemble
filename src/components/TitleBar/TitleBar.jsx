import {
  AppBar,
  Toolbar,
  Typography,
} from '@material-ui/core';
import React from 'react';


export default class TitleBar extends React.Component {
  render() {
    return (
      <AppBar>
        <Toolbar>
          <Typography variant="title" color="inherit">
            Appsemble
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
}
