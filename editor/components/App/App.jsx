import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import AppList from '../AppList';
import Editor from '../Editor';
import { initAuth } from '../../../app/actions/user';
import EmailLogin from '../../../app/components/EmailLogin';

export class App extends React.Component {
  async componentDidMount() {
    const { initAuth: authenticate, authentication } = this.props;
    await authenticate(authentication);
  }

  render() {
    const {
      user: { user, initialized },
      authentication,
    } = this.props;

    if (!initialized) {
      return 'Loading...';
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        {!user ? (
          <EmailLogin
            key="appsemble-editor-email-login"
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
                render={props => <Editor id={props.match.params.id} {...props} />}
              />
              <Route path="/editor" render={props => <AppList {...props} />} />
            </Switch>
          </Router>
        )}
      </IntlProvider>
    );
  }
}

export default connect(
  state => ({
    user: state.user,
  }),
  { initAuth },
)(App);
