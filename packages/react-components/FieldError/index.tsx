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

  /**
   * The id of the error element, so form controls can refer to it.
   */
  readonly id?: string;
}

/**
 * Render the error message of a form field.
 */
export function FieldError({ children, className, id }: FieldErrorProps): ReactNode {
  return (
    <div className={classNames('help is-danger', styles.root, className)} id={id}>
      <Icon className={styles.icon} icon={messageIcons.danger} size="small" />
      <span>{children}</span>
    </div>
  );
}
