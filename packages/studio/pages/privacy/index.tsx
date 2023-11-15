import { useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';

import { messages } from './messages.js';
import PrivacyPolicy from './privacy-policy.md';

export function PrivacyPolicyPage(): ReactNode {
  useMeta(messages.title, messages.description);

  return <PrivacyPolicy />;
}
