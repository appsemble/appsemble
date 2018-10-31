import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import Editor from '../Editor';
import Login from '../Login';
import { initAuth } from '../../../app/actions/user';

export class App extends React.Component {
  async componentDidMount() {
    const { initAuth: authenticate, authentication } = this.props;
    await authenticate(authentication);
  }

  render() {
    const {
      user: { user, initialized },
    } = this.props;

    if (!initialized) {
      return 'Loading...';
    }

    return (
      <IntlProvider defaultLocale="en-US" locale="en-US" textComponent={React.Fragment}>
        <Router>
          {!user ? (
            <Route render={props => <Login {...props} {...this.props} />} />
          ) : (
            <Route
              path="/editor/:id"
              render={props => <Editor id={props.match.params.id} {...props} />}
            />
          )}
        </Router>
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
