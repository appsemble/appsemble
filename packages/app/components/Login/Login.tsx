import { App } from '@appsemble/types';
import React from 'react';

import EmailLogin from '../EmailLogin';

export interface LoginProps {
  app: App;
}

/**
 * Render all different authentication methods for an app.
 */
export default class Login extends React.Component<LoginProps> {
  render(): React.ReactNode {
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
