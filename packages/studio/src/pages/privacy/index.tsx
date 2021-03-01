import { useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';

import { messages } from './messages';
import PrivacyPolicy from './privacy-policy.md';

export function PrivacyPolicyPage(): ReactElement {
  useMeta(messages.title, messages.description);

  return <PrivacyPolicy />;
}
