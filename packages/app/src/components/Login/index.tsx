import { useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { Redirect } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { EmailLogin } from '../EmailLogin';
import { OpenIDLogin } from '../OpenIDLogin';
import { useUser } from '../UserProvider';

export function Login(): ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn } = useUser();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    return <Redirect to={redirect || normalize(definition.defaultPage)} />;
  }

  if (definition.security.login === 'password') {
    return <EmailLogin />;
  }

  return <OpenIDLogin />;
}
