import { loadOAuth2State } from '@appsemble/web-utils';
import React, { ReactElement, useMemo } from 'react';

import { ExtendedOAuth2State } from '../../types';
import { OAuth2AppCallback } from '../OAuth2AppCallback';
import { OAuth2StudioCallback } from '../OAuth2StudioCallback';

export function OAuth2Callback(): ReactElement {
  const session = useMemo(() => loadOAuth2State<ExtendedOAuth2State>(), []);

  if ('appRequest' in session) {
    return <OAuth2AppCallback session={session} />;
  }

  return <OAuth2StudioCallback session={session} />;
}
