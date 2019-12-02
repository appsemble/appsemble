import { ErrorHandler, Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import settings from '../../utils/settings';
import AnonymousRoute from '../AnonymousRoute';
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
              <Route component={AppList} exact path="/apps" />
              <ProtectedRoute component={Settings} path="/settings" />
              <Route component={AppContext} path="/apps/:id(\d+)" />
              <AnonymousRoute component={EditPassword} exact path="/edit-password" />
              <ProtectedRoute component={OrganizationInvite} exact path="/organization-invite" />
              <Route component={VerifyEmail} exact path="/verify" />
              <Route component={AppList} exact path="/apps" />
              <Route component={ConnectOAuth} exact path="/connect" />
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
        </BrowserRouter>
      </IntlProvider>
    );
  }
}
