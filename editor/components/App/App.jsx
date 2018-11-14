import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import React from 'react';
import { IntlProvider } from 'react-intl';

import AppList from '../AppList';
import Editor from '../Editor';
import Login from '../Login';
import Message from '../Message';

export default class App extends React.Component {
  async componentDidMount() {
    const { initAuth, authentication } = this.props;
    await initAuth(authentication);
  }

  render() {
    const {
      user: { user, initialized },
      logout,
    } = this.props;

    if (!initialized) {
      return 'Loading...';
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <div>
          <Router>
            {!user ? (
              <Route render={props => <Login {...props} {...this.props} />} />
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
