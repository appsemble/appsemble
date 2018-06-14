import {
  CssBaseline,
  MuiThemeProvider,
} from '@material-ui/core';
import React from 'react';
import {
  IntlProvider,
} from 'react-intl';
import {
  BrowserRouter,
} from 'react-router-dom';

import AppContext from '../AppContext';
import SideNavigation from '../SideNavigation';
import TitleBar from '../TitleBar';


export default class App extends React.Component {
  render() {
    return (
      <IntlProvider
        locale="en-US"
        defaultLocale="en-US"
        textComponent={React.Fragment}
      >
        <BrowserRouter>
          <MuiThemeProvider>
            <AppContext>
              <CssBaseline />
              <TitleBar />
              <SideNavigation />
            </AppContext>
          </MuiThemeProvider>
        </BrowserRouter>
      </IntlProvider>
    );
  }
}
