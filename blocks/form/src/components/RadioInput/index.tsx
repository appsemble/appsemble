import { FormattedMessage } from '@appsemble/preact';
import { FormComponent } from '@appsemble/preact-components/src';
import classNames from 'classnames';
import { Fragment, h, VNode } from 'preact';

import type { InputProps, RadioField } from '../../../block';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a boolean value.
 */
export default function RadioInput({
  disabled,
  error,
  field,
  onInput,
  value = false,
}: RadioInputProps): VNode {
  return (
    <FormComponent label={field.label} required={field.required}>
      {field.options.map((option, index) => (
        <Fragment>
          <input
            checked={value === option.value}
            className={classNames('is-checkradio', { 'is-danger': error })}
            disabled={disabled}
            id={`${field.name}${index}`}
            name={`${field.name}`}
            onInput={(event) => {
              onInput(event, (event.target as HTMLInputElement).value);
            }}
            readOnly={field.readOnly}
            required={field.required}
            type="radio"
            value={option.value}
          />
          <label for={`${field.name}${index}`}>{option.labelText ?? option.value}</label>
        </Fragment>
      ))}
      {error && (
        <p className={classNames('help', { 'is-danger': error })}>
          <FormattedMessage id="invalid" />
        </p>
      )}
    </FormComponent>
  );
}
