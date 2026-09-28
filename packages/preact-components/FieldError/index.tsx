import { messageIcons } from '@appsemble/web-utils';
import classNames from 'classnames';
import { type ComponentChild, type VNode } from 'preact';

import styles from './index.module.css';
import { Icon } from '../index.js';

interface FieldErrorProps {
  /**
   * The error message.
   */
  readonly children: ComponentChild;

  /**
   * Additional class names to assign to the error element.
   */
  readonly className?: string;
}

/**
 * Render the error message of a form field.
 */
export function FieldError({ children, className }: FieldErrorProps): VNode {
  return (
    <div className={classNames('help is-danger', styles.root, className)}>
      <Icon className={styles.icon} icon={messageIcons.danger} size="small" />
      <span>{children}</span>
    </div>
  );
}
