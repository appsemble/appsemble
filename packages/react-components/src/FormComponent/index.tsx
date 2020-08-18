import type { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import React, { ReactElement, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages';

export interface FormComponentProps {
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
   * A fontaweome icon to render on the left side of the input.
   */
  iconLeft?: IconName;

  iconRight?: boolean;

  /**
   * The label element to render.
   */
  label?: ReactNode;

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
  iconLeft,
  iconRight,
  id,
  label,
  required,
}: FormComponentProps): ReactElement {
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
          'has-icons-left': iconLeft,
          'has-icons-right': iconRight,
        })}
      >
        {children}
      </div>
    </div>
  );
}
