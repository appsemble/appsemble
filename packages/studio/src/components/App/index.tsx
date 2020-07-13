import { Confirmation, ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { Helmet } from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import settings from '../../utils/settings';
import AnonymousRoute from '../AnonymousRoute';
import AppContext from '../AppContext';
import AppList from '../AppList';
import BlockDetails from '../BlockDetails';
import BlockList from '../BlockList';
import EditPassword from '../EditPassword';
import ErrorFallback from '../ErrorFallback';
import ForwardOAuth2Login from '../ForwardOAuth2Login';
import Login from '../Login';
import OAuth2Callback from '../OAuth2Callback';
import OpenIDLogin from '../OpenIDLogin';
import OrganizationInvite from '../OrganizationInvite';
import OrganizationsProvider from '../OrganizationsProvider';
import ProtectedRoute from '../ProtectedRoute';
import Register from '../Register';
import ResetPassword from '../ResetPassword';
import Settings from '../Settings';
import Toolbar from '../Toolbar';
import UserProvider from '../UserProvider';
import VerifyEmail from '../VerifyEmail';

export default function App(): ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <BrowserRouter>
        <UserProvider>
          <OrganizationsProvider>
            <ErrorHandler fallback={ErrorFallback}>
              <Confirmation>
                <MessagesProvider>
                  <Helmet defaultTitle="Appsemble" titleTemplate="Appsemble · %s" />
                  <Toolbar />
                  <Switch>
                    <Route exact path="/apps">
                      <AppList />
                    </Route>
                    <Route exact path="/blocks">
                      <BlockList />
                    </Route>
                    <Route exact path="/blocks/@:organization/:blockName/:version?">
                      <BlockDetails />
                    </Route>
                    <ProtectedRoute path="/settings">
                      <Settings />
                    </ProtectedRoute>
                    <ProtectedRoute exact path="/connect/authorize">
                      <OpenIDLogin />
                    </ProtectedRoute>
                    <Route exact path="/connect/authorize/:id">
                      <ForwardOAuth2Login />
                    </Route>
                    <Route path="/apps/:id(\d+)">
                      <AppContext />
                    </Route>
                    <AnonymousRoute exact path="/edit-password">
                      <EditPassword />
                    </AnonymousRoute>
                    <ProtectedRoute exact path="/organization-invite">
                      <OrganizationInvite />
                    </ProtectedRoute>
                    <Route exact path="/verify">
                      <VerifyEmail />
                    </Route>
                    <Route exact path="/callback">
                      <OAuth2Callback />
                    </Route>
                    <AnonymousRoute exact path="/login">
                      <Login />
                    </AnonymousRoute>
                    {settings.enableRegistration && (
                      <AnonymousRoute exact path="/register">
                        <Register />
                      </AnonymousRoute>
                    )}
                    <Route exact path="/reset-password">
                      <ResetPassword />
                    </Route>
                    <Route exact path="/edit-password">
                      <EditPassword />
                    </Route>
                    <Route exact path="/verify">
                      <VerifyEmail />
                    </Route>
                    <Redirect to="/apps" />
                  </Switch>
                </MessagesProvider>
              </Confirmation>
            </ErrorHandler>
          </OrganizationsProvider>
        </UserProvider>
      </BrowserRouter>
    </IntlProvider>
  );
}
