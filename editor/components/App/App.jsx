import { Loader } from '@appsemble/react-components';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';

import AppList from '../AppList';
import Editor from '../Editor';
import EmailLogin from '../EmailLogin';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';
import Message from '../Message';
import Register from '../Register';
import messages from './messages';
import styles from './app.css';

export default class App extends React.Component {
  async componentDidMount() {
    const { initAuth, authentication } = this.props;
    await initAuth(authentication);
  }

  render() {
    const {
      user: { user, initialized },
      authentication,
      logout,
    } = this.props;

    if (!initialized) {
      return <Loader />;
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <div>
          <Router>
            {!user ? (
              <Switch>
                <Route component={Register} path="/editor/register" />
                <Route component={ResetPassword} path="/editor/resetPassword" />
                <Route component={ForgotPassword} path="/editor/forgotPassword" />
                <Route
                  path="/editor"
                  render={() => (
                    <div>
                      <EmailLogin
                        authentication={{
                          method: 'email',
                          ...authentication,
                        }}
                      />
                      <div className={styles.links}>
                        <Link to="/editor/register">
                          <FormattedMessage {...messages.registerLink} />
                        </Link>
                        <Link to="/editor/forgotPassword">
                          <FormattedMessage {...messages.forgotPasswordLink} />
                        </Link>
                      </div>
                    </div>
                  )}
                />
              </Switch>
            ) : (
              <Switch>
                <Route
                  path="/editor/:id"
                  render={props => <Editor id={props.match.params.id} {...props} logout={logout} />}
                />
                <Route path="/editor" render={props => <AppList {...props} logout={logout} />} />
              </Switch>
            )}
          </Router>
          <Message />
        </div>
      </IntlProvider>
    );
  }
}
