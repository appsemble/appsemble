import PropTypes from 'prop-types';
import React from 'react';

import EmailLogin from '../EmailLogin';

/**
 * Render all different authentication methods for an app.
 */
export default class Login extends React.Component {
  static propTypes = {
    app: PropTypes.shape().isRequired,
  };

  render() {
    const { app } = this.props;

    return app.authentication.map(authentication => {
      switch (authentication.method) {
        case 'email':
          return (
            <EmailLogin key={JSON.stringify(authentication)} authentication={authentication} />
          );
        default:
          return null;
      }
    });
  }
}
