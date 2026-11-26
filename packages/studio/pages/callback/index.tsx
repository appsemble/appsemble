import { useQuery } from '@appsemble/react-components';
import { loadOAuth2State } from '@appsemble/web-utils';
import { type ReactNode, useMemo } from 'react';

import { OAuth2AppCallback } from '../../components/OAuth2AppCallback/index.js';
import { OAuth2StudioCallback } from '../../components/OAuth2StudioCallback/index.js';
import {
  OAuth2TestLoginCallback,
  oauth2TestLoginKey,
} from '../../components/OAuth2TestLoginCallback/index.js';
import { OrganizationSsoCallback } from '../../components/OrganizationSsoCallback/index.js';
import { type ExtendedOAuth2State } from '../../types.js';

export function CallbackPage(): ReactNode {
  const qs = useQuery();
  const session = useMemo(() => loadOAuth2State<ExtendedOAuth2State>(), []);

  if (qs.get('state') && qs.get('state') === localStorage.getItem(oauth2TestLoginKey)) {
    return <OAuth2TestLoginCallback />;
  }

  if (session?.organizationId) {
    return <OrganizationSsoCallback session={session} />;
  }

  if (session && 'appRequest' in session) {
    return <OAuth2AppCallback session={session} />;
  }

  return <OAuth2StudioCallback session={session} />;
}
