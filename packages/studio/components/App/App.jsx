import { ErrorHandler } from '@appsemble/react-components';
import React from 'react';
import Helmet from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import settings from '../../utils/settings';
import AnonymousRoute from '../AnonymousRoute';
import AppContext from '../AppContext';
import AppList from '../AppList';
import EditPassword from '../EditPassword';
import ErrorFallback from '../ErrorFallback';
import Login from '../Login';
import Message from '../Message';
import OAuth2Connect from '../OAuth2Connect';
import OrganizationInvite from '../OrganizationInvite';
import ProtectedRoute from '../ProtectedRoute';
import Register from '../Register';
import ResetPassword from '../ResetPassword';
import Settings from '../Settings';
import Toolbar from '../Toolbar';
import UserProvider from '../UserProvider';
import VerifyEmail from '../VerifyEmail';

export default function App() {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <BrowserRouter>
        <UserProvider>
          <ErrorHandler fallback={ErrorFallback}>
            <Helmet defaultTitle="Appsemble" titleTemplate="Appsemble · %s" />
            <Toolbar />
            <Switch>
              <Route component={AppList} exact path="/apps" />
              <ProtectedRoute component={Settings} path="/settings" />
              <Route component={AppContext} path="/apps/:id(\d+)" />
              <AnonymousRoute component={EditPassword} exact path="/edit-password" />
              <ProtectedRoute component={OrganizationInvite} exact path="/organization-invite" />
              <Route component={VerifyEmail} exact path="/verify" />
              <Route component={AppList} exact path="/apps" />
              <Route component={OAuth2Connect} exact path="/connect/:provider/callback" />
              <AnonymousRoute component={Login} exact path="/login" />
              {settings.enableRegistration && (
                <AnonymousRoute component={Register} exact path="/register" />
              )}
              <Route component={ResetPassword} exact path="/reset-password" />
              <Route component={EditPassword} exact path="/edit-password" />
              <Route component={VerifyEmail} exact path="/verify" />
              <Redirect to="/apps" />
            </Switch>
            <Message />
          </ErrorHandler>
        </UserProvider>
      </BrowserRouter>
    </IntlProvider>
  );
}
