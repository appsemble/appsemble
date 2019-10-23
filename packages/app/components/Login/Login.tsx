import { AppDefinition } from '@appsemble/types';
import React from 'react';

import EmailLogin from '../EmailLogin';

export interface LoginProps {
  definition: AppDefinition;
}

/**
 * Render all different authentication methods for an app.
 */
export default function Login({ definition }: LoginProps): React.ReactElement[] {
  return definition.authentication.map(authentication => {
    switch (authentication.method) {
      case 'email':
        return <EmailLogin key={JSON.stringify(authentication)} authentication={authentication} />;
      default:
        return null;
    }
  });
}
