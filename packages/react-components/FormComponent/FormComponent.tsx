import { IconName } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export interface FormComponentProps {
  /**
   * An optional id for the HTML element. If not set, this will fall back to `name`.
   */
  id?: string;

  /**
   * A fontaweome icon to render on the left side of the input.
   */
  iconLeft?: IconName;

  /**
   * The label element to render.
   */
  label: JSX.Element;

  /**
   * Whether or not the input is required.
   */
  required?: boolean;
}

/**
 * A wrapper for creating consistent form components.
 */
export default class FormComponent extends React.Component<FormComponentProps> {
  render(): JSX.Element {
    const { children, iconLeft, id, label, required } = this.props;

    return (
      <div className="field is-horizontal">
        <div className="field-label is-normal">
          <label className="label" htmlFor={id}>
            {label}
            {required || (
              <span className="is-inline has-text-weight-normal">
                {' — '}
                <FormattedMessage {...messages.optional} />
              </span>
            )}
          </label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className={classNames('control', { 'has-icons-left': iconLeft })}>{children}</div>
          </div>
        </div>
      </div>
    );
  }
}
