import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import React from 'react';
import { IntlProvider } from 'react-intl';

import AppContext from '../AppContext';
import AppList from '../AppList';
import CMS from '../CMS';
import Editor from '../Editor';
import EditPassword from '../EditPassword';
import Login from '../Login';
import Message from '../Message';
import ResetPassword from '../ResetPassword';
import VerifyEmail from '../VerifyEmail';
import Register from '../Register';
import Toolbar from '../Toolbar';
import ConnectOAuth from '../ConnectOAuth';

export default class App extends React.Component {
  static propTypes = {
    initAuth: PropTypes.func.isRequired,
    initialized: PropTypes.bool.isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: null,
  };

  async componentDidMount() {
    const { initAuth } = this.props;
    await initAuth();
  }

  render() {
    const { initialized, user } = this.props;

    if (!initialized) {
      return <Loader />;
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <BrowserRouter>
          <React.Fragment>
            <Toolbar />
            {user ? (
              <Switch>
                <Route component={AppList} exact path="/" />
                <Route
                  path="/_/:id(\d+)"
                  render={props => (
                    <AppContext {...props}>
                      <Route component={Editor} exact path="/_/:id/edit" />
                      <Route component={CMS} path="/_/:id/cms" />
                    </AppContext>
                  )}
                />
                <Route component={EditPassword} exact path="/_/edit-password" />
                <Redirect to="/" />
              </Switch>
            ) : (
              <Switch>
                <Route component={ConnectOAuth} exact path="/_/connect" />
                <Route component={Login} exact path="/_/login" />
                <Route component={Register} exact path="/_/register" />
                <Route component={ResetPassword} exact path="/_/reset-password" />
                <Route component={EditPassword} exact path="/_/edit-password" />
                <Route component={VerifyEmail} exact path="/_/verify" />
                <Redirect to="/_/login" />
              </Switch>
            )}
            <Message />
          </React.Fragment>
        </BrowserRouter>
      </IntlProvider>
    );
  }
}
