import { FormattedMessage } from '@appsemble/preact';
import { FormComponent, RadioButton } from '@appsemble/preact-components/src';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { InputProps, RadioField } from '../../../block';
import styles from './index.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export default function RadioInput({
  disabled,
  error,
  field,
  onInput,
  value,
}: RadioInputProps): VNode {
  return (
    <FormComponent label={field.label} required={field.required}>
      {field.options.map((option, index) => (
        <RadioButton
          checked={value === option.value}
          disabled={disabled}
          help={option.labelText ?? option.value}
          id={`${field.name}${index}`}
          name={`${field.name}`}
          onChange={(event, v) => {
            onInput(event, v);
          }}
          readOnly={field.readOnly}
          value={option.value}
          wrapperClassName={styles.choice}
        />
      ))}
      {error && (
        <p className={classNames('help', { 'is-danger': error })}>
          <FormattedMessage id="invalid" />
        </p>
      )}
    </FormComponent>
  );
}
