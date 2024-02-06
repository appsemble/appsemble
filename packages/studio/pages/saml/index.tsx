import { type SAMLStatus } from '@appsemble/types';
import { type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { ConfigurationError } from './ConfigurationError/index.js';
import { EmailConflict } from './EmailConflict/index.js';
import { messages } from './messages.js';

export function SAMLResponsePage(): ReactNode {
  const { code } = useParams<{ code: SAMLStatus }>();

  switch (code) {
    case 'invalidrelaystate':
      return <ConfigurationError message={messages.invalidRelayState} />;
    case 'invalidsecret':
      return <ConfigurationError message={messages.invalidSecret} />;
    case 'invalidstatuscode':
      return <ConfigurationError message={messages.invalidStatusCode} />;
    case 'badsignature':
      return <ConfigurationError message={messages.badSignature} />;
    case 'missingsubject':
      return <ConfigurationError message={messages.missingSubject} />;
    case 'missingnameid':
      return <ConfigurationError message={messages.missingNameID} />;
    case 'emailconflict':
      return <EmailConflict />;
    default:
      return <div>Oh no</div>;
  }
}
