import {
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
import Main from '../Main';
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
        <MuiThemeProvider>
          <BrowserRouter>
            <AppContext>
              <TitleBar />
              <SideNavigation />
              <Main />
            </AppContext>
          </BrowserRouter>
        </MuiThemeProvider>
      </IntlProvider>
    );
  }
}
