import { useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Redirect } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { useAppDefinition } from '../AppDefinitionProvider';
import { EmailLogin } from '../EmailLogin';
import { OpenIDLogin } from '../OpenIDLogin';
import { useUser } from '../UserProvider';

export function Login(): ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Redirect to={redirect || normalize(defaultPageName)} />;
  }

  if (definition.security.login === 'password') {
    return <EmailLogin />;
  }

  return <OpenIDLogin />;
}
