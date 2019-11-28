import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

interface FormComponentProps {
  children: React.ReactNode;

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
  label?: React.ReactNode;

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
  iconRight,
  id,
  label,
  required,
}: FormComponentProps): React.ReactElement {
  return (
    <div className="field">
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
