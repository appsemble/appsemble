import { ErrorHandler } from '@appsemble/react-components';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppContext from '../AppContext';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import Message from '../Message';
import SideNavigation from '../SideNavigation';

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default class App extends React.Component {
  render() {
    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <ErrorHandler fallback={ErrorFallback}>
          <MuiThemeProvider theme={createMuiTheme()}>
            <BrowserRouter basename={new URL(document.baseURI).pathname}>
              <AppContext>
                <SideNavigation />
                <Main />
                <Message />
              </AppContext>
            </BrowserRouter>
          </MuiThemeProvider>
        </ErrorHandler>
      </IntlProvider>
    );
  }
}
