import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import Editor from '../Editor';
import EmailLogin from '../../../app/components/EmailLogin';

const authentication = {
  url: `${window.location.origin}/oauth/token`,
  refreshURL: `${window.location.origin}/oauth/token`,
  clientId: 'appsemble-editor',
  scope: 'editor',
};

export class App extends React.Component {
  render() {
    const { user } = this.props;

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

export default connect(state => ({ user: state.user }))(App);
