import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import React from 'react';
import { IntlProvider, FormattedMessage } from 'react-intl';

import AppList from '../AppList';
import Editor from '../Editor';
import EmailLogin from '../EmailLogin';
import Message from '../Message';
import Register from '../Register';
import messages from './messages';

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
      return 'Loading...';
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <div>
          {!user ? (
            <Router>
              <Switch>
                <Route path="/editor/register" render={() => <Register />} />
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
                      <Link to="/editor/register">
                        <FormattedMessage {...messages.registerLink} />
                      </Link>
                    </div>
                  )}
                />
              </Switch>
            </Router>
          ) : (
            <Router>
              <Switch>
                <Route
                  path="/editor/:id"
                  render={props => <Editor id={props.match.params.id} {...props} logout={logout} />}
                />
                <Route path="/editor" render={props => <AppList {...props} logout={logout} />} />
              </Switch>
            </Router>
          )}
          <Message />
        </div>
      </IntlProvider>
    );
  }
}
