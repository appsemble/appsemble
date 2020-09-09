import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React, { cloneElement, isValidElement, ReactElement, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { Icon } from '..';
import styles from './index.css';
import { messages } from './messages';

/**
 * These props are typically inherited by a component that implements `FormComponent`.
 */
export interface SharedFormComponentProps {
  /**
   * An additional control node to render right of the form field.
   */
  control?: ReactElement;

  /**
   * An error message to render. This will also make the help text red.
   */
  error?: ReactNode;

  /**
   * A help message to render.
   */
  help?: ReactNode;

  /**
   * A fontaweome icon to render on the left side of the input.
   */
  icon?: IconName;

  /**
   * The label element to render.
   */
  label?: ReactNode;
}

export interface FormComponentProps extends SharedFormComponentProps {
  children: ReactNode;

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
  helpExtra?: ReactNode;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;
}

/**
 * A wrapper for creating consistent form components.
 */
export function FormComponent({
  children,
  className,
  control,
  error,
  help,
  helpExtra,
  icon,
  id,
  label,
  required,
}: FormComponentProps): ReactElement {
  const helpContent = (
    <span className={classNames('help', { 'is-danger': error })}>
      {isValidElement(error) ? error : help}
    </span>
  );

  return (
    <div className={classNames('field', className)}>
      {label ? (
        <label className="label" htmlFor={id}>
          {label}
          {required || (
            <span className="is-pulled-right has-text-weight-normal">
              (<FormattedMessage {...messages.optional} />)
            </span>
          )}
        </label>
      ) : null}
      <div
        className={classNames('control', {
          'has-icons-left': icon,
          'has-icons-right': control,
        })}
      >
        {children}
        {icon && <Icon className="is-left" icon={icon} />}
        {control && cloneElement(control, { className: 'is-right' })}
        {helpExtra ? (
          <div className={`${styles.help} is-flex`}>
            {helpContent}
            <span className={`help ml-1 ${styles.counter}`}>{helpExtra}</span>
          </div>
        ) : (
          helpContent
        )}
      </div>
    </div>
  );
}
