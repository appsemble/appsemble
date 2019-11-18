import { ErrorHandler } from '@appsemble/react-components';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';

import AppContext from '../AppContext';
import BottomNavigation from '../BottomNavigation';
import ErrorFallback from '../ErrorFallback';
import Main from '../Main';
import Message from '../Message';
import PermissionRequest from '../PermissionRequest';
import SideNavigation from '../SideNavigation';

const [base] = document.head.getElementsByTagName('base');

/**
 * The main entry point of the React app.
 *
 * This configures all providers and sets up the global app structure.
 */
export default function App() {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <ErrorHandler fallback={ErrorFallback}>
        <BrowserRouter basename={base && new URL(base.href).pathname}>
          <AppContext>
            <PermissionRequest />
            <Main />
            <SideNavigation />
            <BottomNavigation />
            <Message />
          </AppContext>
        </BrowserRouter>
      </ErrorHandler>
    </IntlProvider>
  );
}
