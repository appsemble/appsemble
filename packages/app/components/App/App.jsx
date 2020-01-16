import { ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppContext from '../AppContext';
import BottomNavigation from '../BottomNavigation';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import PermissionRequest from '../PermissionRequest';
import SideNavigation from '../SideNavigation';

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function App() {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <ErrorHandler fallback={ErrorFallback}>
        <MessagesProvider>
          <BrowserRouter>
            <AppContext>
              <PermissionRequest />
              <Main />
              <SideNavigation />
              <BottomNavigation />
            </AppContext>
          </BrowserRouter>
        </MessagesProvider>
      </ErrorHandler>
    </IntlProvider>
  );
}
