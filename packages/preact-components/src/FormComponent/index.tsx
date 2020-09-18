import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { cloneElement, ComponentChild, h, isValidElement, VNode } from 'preact';
import { forwardRef } from 'preact/compat';

import { Icon } from '..';
import styles from './index.css';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * A Bulma addon to display.
   */
  addon?: ComponentChild;

  /**
   * An additional control node to render right of the form field.
   */
  control?: VNode;

  /**
   * An error message to render. This will also make the help text red.
   */
  error?: ComponentChild;

  /**
   * A help message to render.
   */
  help?: ComponentChild;

  /**
   * A fontaweome icon to render on the left side of the input.
   */
  icon?: IconName;

  /**
   * The label element to render.
   */
  label?: ComponentChild;

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

export interface FormComponentProps extends SharedFormComponentProps {
  children: ComponentChild;

  /**
   * A class name to pass to the field element.
   */
  className?: string;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

  /**
   * An extra message to display right of the help text.
   */
  helpExtra?: ComponentChild;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;
}

/**
 * A wrapper for creating consistent form components.
 */
export const FormComponent = forwardRef<HTMLDivElement, FormComponentProps>(
  (
    {
      addon,
      children,
      className,
      control,
      error,
      help,
      helpExtra,
      icon,
      id,
      label,
      optionalLabel = '(Optional)',
      required,
      tag,
    },
    ref,
  ) => {
    const helpContent = (
      <span className={classNames(`help ${styles.help}`, { 'is-danger': error })}>
        {isValidElement(error) ? error : help}
      </span>
    );

    const controls = (
      <div
        className={classNames(`control ${styles.control}`, {
          'has-icons-left': icon,
          'has-icons-right': control,
        })}
      >
        {children}
        {icon && <Icon className="is-left" icon={icon} />}
        {control && cloneElement(control, { className: 'is-right' })}
      </div>
    );

    return (
      <div className={classNames('field', className)} ref={ref}>
        {label ? (
          <label className="label" htmlFor={id}>
            {label}
            {(!required || tag) && (
              <span className="is-pulled-right has-text-weight-normal">{tag || optionalLabel}</span>
            )}
          </label>
        ) : null}
        {addon ? (
          <div className="field is-marginless has-addons">
            {controls}
            <label className="control" htmlFor={id}>
              {addon}
            </label>
          </div>
        ) : (
          controls
        )}
        {helpExtra ? (
          <div className={`is-flex ${styles.helpWrapper}`}>
            {helpContent}
            <span className={`help ml-1 ${styles.counter}`}>{helpExtra}</span>
          </div>
        ) : (
          helpContent
        )}
      </div>
    );
  },
);
