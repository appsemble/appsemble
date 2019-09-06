/** @jsx h */
import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentChildren, h, VNode } from 'preact';

import styles from './FormComponent.css';
import messages from './messages';

export interface FormComponentProps {
  children: ComponentChildren;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

  /**
   * A fontawesome icon to render on the left side of the input.
   */
  iconLeft?: IconName;

  /**
   * The label element to render.
   */
  label: ComponentChildren;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;
}

/**
 * A wrapper for creating consistent form components.
 */
export default function FormComponent({
  children,
  iconLeft,
  id,
  label,
  required,
}: FormComponentProps): VNode {
  return (
    <div className="field">
      <label className={`label ${styles.label}`} htmlFor={id}>
        <span className={styles.labelContent}>{label}</span>
        {required || (
          <span
            className={`is-inline has-text-weight-normal has-text-grey-light ${styles.optional}`}
          >
            ({messages.optional})
          </span>
        )}
      </label>
      <div className={classNames('control', { 'has-icons-left': iconLeft })}>{children}</div>
    </div>
  );
}
