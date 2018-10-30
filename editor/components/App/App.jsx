import { BrowserRouter as Router, Route } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider, FormattedMessage } from 'react-intl';

import messages from './messages';
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
          <div>
            <EmailLogin
              key="appsemble-editor-email-login"
              authentication={{
                method: 'email',
                ...authentication,
              }}
            />
            <div>
              <a href="/api/oauth/connect/google">
                <FormattedMessage {...messages.login} values={{ provider: <span>Google</span> }} />
              </a>
              <a href="/api/oauth/connect/gitlab">
                <FormattedMessage {...messages.login} values={{ provider: <span>GitLab</span> }} />
              </a>
            </div>
          </div>
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
    user: state.user,
  }),
  { initAuth },
)(App);
