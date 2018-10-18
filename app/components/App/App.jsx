import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppContext from '../AppContext';
import Main from '../Main';
import SideNavigation from '../SideNavigation';
import TitleBar from '../TitleBar';

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default class App extends React.Component {
  render() {
    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <MuiThemeProvider theme={createMuiTheme()}>
          <BrowserRouter basename={new URL(document.baseURI).pathname}>
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
