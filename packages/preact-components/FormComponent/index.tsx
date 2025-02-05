import { type IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import { cloneElement, type ComponentChild, isValidElement, type VNode } from 'preact';
import { forwardRef } from 'preact/compat';

import styles from './index.module.css';
import { Icon } from '../index.js';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * An optional class name.
   */
  className?: string;

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
   * A fontawesome icon to render on the left side of the input.
   */
  icon?: IconName;

  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

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
   * The name for the HTML element.
   */
  name?: string;

  /**
   * Whether or not the field is required
   */
  required?: boolean;

  /**
   * The tag to display next to the label.
   */
  tag?: ComponentChild;

  /**
   * Combines fields on the same row.
   *
   * Fields are combined in order if set to true.
   */
  inline?: true;
}

export interface FormComponentProps extends SharedFormComponentProps {
  children: ComponentChild;

  /**
   * An extra message to display right of the help text.
   */
  helpExtra?: ComponentChild;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;

  /**
   * Whether or not the help section should be rendered.
   */
  disableHelp?: boolean;
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
      disableHelp,
      error,
      help,
      helpExtra,
      icon,
      id,
      inline,
      label,
      optionalLabel = '(Optional)',
      required,
      tag,
    },
    ref,
  ) => {
    const helpContent = (
      <span
        className={classNames(`help ${styles.help}`, { 'is-danger': error })}
        data-testid="help-formcomp"
      >
        {isValidElement(error) || typeof error === 'string' || Number.isFinite(error)
          ? error
          : help}
      </span>
    );

    const controls = (
      <div
        className={classNames(`control ${styles.control}`, {
          'has-icons-left': icon,
          'has-icons-right': control,
        })}
      >
        {icon ? <Icon className="is-left" icon={icon} /> : null}
        {children}
        {control ? cloneElement(control, { className: 'is-right' }) : null}
      </div>
    );

    return (
      <div
        className={classNames('field', className, { [styles.inline]: inline })}
        data-testid="submit-formcomp"
        ref={ref}
      >
        {label ? (
          <label className="label" data-testid="label-formcomp" htmlFor={id}>
            {label}
            {!required || tag ? (
              <span className="is-pulled-right has-text-weight-normal" data-testid="tag-formcomp">
                {tag || optionalLabel}
              </span>
            ) : null}
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
        {disableHelp ? null : helpExtra ? (
          <div className={`is-flex ${styles.helpWrapper}`} data-testid>
            {helpContent}
            <span className={`help ml-1 ${styles.counter}`} data-testid="help-extra-formcomp">
              {helpExtra}
            </span>
          </div>
        ) : (
          helpContent
        )}
      </div>
    );
  },
);
