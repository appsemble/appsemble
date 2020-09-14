import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { ComponentChild, ComponentChildren, h } from 'preact';
import { forwardRef } from 'preact/compat';

import styles from './index.css';

export interface FormComponentProps {
  children: ComponentChildren;

  /**
   * A class name to pass to the field element.
   */
  className?: string;

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

  /**
   * The label used for optional fields.
   *
   * @default '(Optional)'
   */
  optionalLabel?: ComponentChild;

  /**
   * The tag to display next to the label.
   */
  tag?: ComponentChild;
}

/**
 * A wrapper for creating consistent form components.
 */
export const FormComponent = forwardRef<HTMLDivElement, FormComponentProps>(
  (
    { children, className, iconLeft, id, label, optionalLabel = '(Optional)', required, tag },
    ref,
  ) => (
    <div className={classNames('field', className)} ref={ref}>
      {label && (
        <label className={`label ${styles.label}`} htmlFor={id}>
          <span className={styles.labelContent}>{label}</span>
          {(!required || tag) && (
            <span
              className={`is-inline has-text-weight-normal has-text-grey-light ${styles.optional}`}
            >
              {tag || optionalLabel}
            </span>
          )}
        </label>
      )}
      <div className={classNames('control', { 'has-icons-left': iconLeft })}>{children}</div>
    </div>
  ),
);
