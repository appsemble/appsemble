import { type ServiceAuthenticationMethod } from '@appsemble/types';
import { type ReactElement } from 'react';

import { ClientCertificateFieldset } from './ClientCertificateFieldset/index.js';
import { ClientCredentialsFieldset } from './ClientCredentialsFieldset/index.js';
import { CookieFieldset } from './CookieFieldset/index.js';
import { HeaderFieldset } from './HeaderFieldset/index.js';
import { HttpBasicFieldset } from './HttpBasicFieldset/index.js';
import { QueryParameterFieldset } from './QueryParameterFieldset/index.js';

interface SwitchFieldProps {
  readonly disabled: boolean;
  readonly method: ServiceAuthenticationMethod;
}

export function SwitchField({ disabled, method }: SwitchFieldProps): ReactElement {
  switch (method) {
    case 'http-basic':
      return <HttpBasicFieldset disabled={disabled} />;
    case 'client-certificate':
      return <ClientCertificateFieldset disabled={disabled} />;
    case 'client-credentials':
      return <ClientCredentialsFieldset disabled={disabled} />;
    case 'cookie':
      return <CookieFieldset disabled={disabled} />;
    case 'custom-header':
      return <HeaderFieldset disabled={disabled} />;
    case 'query-parameter':
      return <QueryParameterFieldset disabled={disabled} />;
    default:
      return null;
  }
}
