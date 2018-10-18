import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import Editor from '../Editor';
import { initAuth } from '../../../app/actions/user';
import EmailLogin from '../../../app/components/EmailLogin';

export class App extends React.Component {
  async componentDidMount() {
    const { initAuth: authenticate } = this.props;
    await authenticate();
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
      <IntlProvider locale="en-US" defaultLocale="en-US" textComponent={React.Fragment}>
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
            <Route
              path="/editor/:id"
              render={props => <Editor id={props.match.params.id} {...props} />}
            />
          </Router>
        )}
      </IntlProvider>
    );
  }
}

export default connect(
  state => ({
    authentication: state.app.app.authentication,
    user: state.user,
  }),
  { initAuth },
)(App);
