import { Confirmation, ErrorHandler, MessagesProvider } from '@appsemble/react-components';
import { MDXProvider } from '@mdx-js/react';
import React, { ReactElement } from 'react';
import { Helmet } from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import { enableRegistration } from '../../utils/settings';
import { AnonymousRoute } from '../AnonymousRoute';
import { AppContext } from '../AppContext';
import { AppList } from '../AppList';
import { BlockDetails } from '../BlockDetails';
import { BlockList } from '../BlockList';
import { Docs } from '../Docs';
import { EditPassword } from '../EditPassword';
import { ErrorFallback } from '../ErrorFallback';
import { ForwardOAuth2Login } from '../ForwardOAuth2Login';
import { Login } from '../Login';
import { MDXAnchor, MDXCode, MDXPre } from '../MDX';
import { OAuth2Callback } from '../OAuth2Callback';
import { OpenIDLogin } from '../OpenIDLogin';
import { OrganizationInvite } from '../OrganizationInvite';
import { ProtectedRoute } from '../ProtectedRoute';
import { Register } from '../Register';
import { ResetPassword } from '../ResetPassword';
import { Settings } from '../Settings';
import { Toolbar } from '../Toolbar';
import { UserProvider } from '../UserProvider';
import { VerifyEmail } from '../VerifyEmail';

export function App(): ReactElement {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      <MDXProvider
        components={{
          a: MDXAnchor,
          pre: MDXPre,
          code: MDXCode,
        }}
      >
        <BrowserRouter>
          <UserProvider>
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
                    <Route exact path="/organization-invite">
                      <OrganizationInvite />
                    </Route>
                    <Route exact path="/verify">
                      <VerifyEmail />
                    </Route>
                    <Route exact path="/callback">
                      <OAuth2Callback />
                    </Route>
                    <AnonymousRoute exact path="/login">
                      <Login />
                    </AnonymousRoute>
                    {enableRegistration && (
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
                    <Route path="/docs">
                      <Docs />
                    </Route>
                    <Redirect to="/apps" />
                  </Switch>
                </MessagesProvider>
              </Confirmation>
            </ErrorHandler>
          </UserProvider>
        </BrowserRouter>
      </MDXProvider>
    </IntlProvider>
  );
}
