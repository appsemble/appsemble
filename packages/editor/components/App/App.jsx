import { ErrorHandler, Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import AppContext from '../AppContext';
import AppList from '../AppList';
import ConnectOAuth from '../ConnectOAuth';
import EditPassword from '../EditPassword';
import ErrorFallback from '../ErrorFallback';
import Login from '../Login';
import Message from '../Message';
import OrganizationInvite from '../OrganizationInvite';
import ProtectedRoute from '../ProtectedRoute';
import Register from '../Register';
import ResetPassword from '../ResetPassword';
import Settings from '../Settings';
import Toolbar from '../Toolbar';
import VerifyEmail from '../VerifyEmail';

export default class App extends React.Component {
  static propTypes = {
    initAuth: PropTypes.func.isRequired,
    initialized: PropTypes.bool.isRequired,
  };

  async componentDidMount() {
    const { initAuth } = this.props;
    await initAuth();
  }

  render() {
    const { initialized } = this.props;

    if (!initialized) {
      return <Loader />;
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US">
        <BrowserRouter>
          <ErrorHandler fallback={ErrorFallback}>
            <Helmet defaultTitle="Appsemble" titleTemplate="Appsemble · %s" />
            <Toolbar />
            <Switch>
              <Route component={AppList} exact path="/_/apps" />
              <ProtectedRoute component={Settings} path="/_/settings" />
              <ProtectedRoute component={AppContext} path="/_/apps/:id(\d+)" />
              <ProtectedRoute component={EditPassword} exact path="/_/edit-password" />
              <ProtectedRoute component={OrganizationInvite} exact path="/_/organization-invite" />
              <Route component={VerifyEmail} exact path="/_/verify" />
              <Route component={AppList} exact path="/_/apps" />
              <Route component={ConnectOAuth} exact path="/_/connect" />
              <Route component={Login} exact path="/_/login" />
              {window.settings.enableRegistration && (
                <Route component={Register} exact path="/_/register" />
              )}
              <Route component={ResetPassword} exact path="/_/reset-password" />
              <Route component={EditPassword} exact path="/_/edit-password" />
              <Route component={VerifyEmail} exact path="/_/verify" />
              <Redirect to="/_/apps" />
            </Switch>
            <Message />
          </ErrorHandler>
        </BrowserRouter>
      </IntlProvider>
    );
  }
}
