import { loadOAuth2State } from '@appsemble/web-utils';
import * as React from 'react';

import type { ExtendedOAuth2State } from '../../types';
import OAuth2AppCallback from '../OAuth2AppCallback';
import OAuth2StudioCallback from '../OAuth2StudioCallback';

export default function OAuth2Callback(): React.ReactElement {
  const session = React.useMemo(() => loadOAuth2State<ExtendedOAuth2State>(), []);

  if ('appRequest' in session) {
    return <OAuth2AppCallback session={session} />;
  }

  return <OAuth2StudioCallback session={session} />;
}
