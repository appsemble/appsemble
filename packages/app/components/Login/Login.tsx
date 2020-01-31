import React from 'react';

import { useAppDefinition } from '../AppDefinitionProvider';
import EmailLogin from '../EmailLogin';

/**
 * Render all different authentication methods for an app.
 */
export default function Login(): React.ReactElement {
  const { definition } = useAppDefinition();
  return definition.authentication.map(authentication => {
    switch (authentication.method) {
      case 'email':
        return <EmailLogin key={JSON.stringify(authentication)} />;
      default:
        return null;
    }
  }) as any;
}
