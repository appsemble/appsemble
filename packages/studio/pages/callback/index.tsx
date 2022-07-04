import { loadOAuth2State } from '@appsemble/web-utils';
import { ReactElement, useMemo } from 'react';

import { OAuth2AppCallback } from '../../components/OAuth2AppCallback';
import { OAuth2StudioCallback } from '../../components/OAuth2StudioCallback';
import { ExtendedOAuth2State } from '../../types';

export function CallbackPage(): ReactElement {
  const session = useMemo(() => loadOAuth2State<ExtendedOAuth2State>(), []);

  if ('appRequest' in session) {
    return <OAuth2AppCallback session={session} />;
  }

  return <OAuth2StudioCallback session={session} />;
}
