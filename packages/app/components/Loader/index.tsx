import { Loader as BaseLoader } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useContext } from 'preact/hooks';

import { messages } from './messages.js';
import { IntlContext } from '../IntlProvider/index.js';

interface LoaderProps {
  readonly className?: string;
}

export function Loader({ className }: LoaderProps): VNode {
  // A loader shown while the messages themselves load renders outside an `IntlProvider`.
  const intl = useContext(IntlContext);

  return <BaseLoader className={className} label={intl?.formatMessage(messages.loading)} />;
}
