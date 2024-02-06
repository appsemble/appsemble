import { useLocationString } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { TeamInvitePrompt } from './TeamInvitePrompt/index.js';
import { useUser } from '../UserProvider/index.js';

export function TeamInvite(): ReactNode {
  const { isLoggedIn } = useUser();
  const redirect = useLocationString();
  const { lang } = useParams<{ lang: string }>();

  if (!isLoggedIn) {
    return (
      <Navigate
        to={{ pathname: `/${lang}/Login`, search: String(new URLSearchParams({ redirect })) }}
      />
    );
  }

  return <TeamInvitePrompt />;
}
