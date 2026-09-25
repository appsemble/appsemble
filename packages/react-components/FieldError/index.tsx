import { messageIcons } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ReactNode } from 'react';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface FieldErrorProps {
  /**
   * The error message.
   */
  readonly children: ReactNode;

  /**
   * Additional class names to assign to the error element.
   */
  readonly className?: string;
}

/**
 * Render the error message of a form field.
 */
export function FieldError({ children, className }: FieldErrorProps): ReactNode {
  return (
    <p className={classNames('help is-danger', styles.root, className)}>
      <Icon className={styles.icon} icon={messageIcons.danger} size="small" />
      <span>{children}</span>
    </p>
  );
}
