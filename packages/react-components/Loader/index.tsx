import classNames from 'classnames';
import { type ElementType, type ReactNode, useContext } from 'react';
import { IntlContext } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface LoaderProps {
  readonly className?: string;
  readonly component?: ElementType;
}

export function Loader({
  className,
  component: Component = 'div',
  ...props
}: LoaderProps): ReactNode {
  // A loader shown while the messages themselves load renders outside an `IntlProvider`.
  const intl = useContext(IntlContext);

  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <Component
      className={classNames(styles.loader, 'appsemble-loader', className)}
      role="status"
      {...props}
    >
      {intl ? <span className="is-sr-only">{intl.formatMessage(messages.loading)}</span> : null}
    </Component>
  );
}
