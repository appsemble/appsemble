import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import React from 'react';
import { IntlProvider } from 'react-intl';

import AppList from '../AppList';
import Editor from '../Editor';
import EmailLogin from '../EmailLogin';
import Message from '../Message';

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
            <EmailLogin
              authentication={{
                method: 'email',
                ...authentication,
              }}
            />
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
