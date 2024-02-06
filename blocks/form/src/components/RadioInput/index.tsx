import { FormattedMessage, useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type InputProps, type RadioField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { isRequired } from '../../utils/requirements.js';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export function RadioInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
  readOnly,
}: RadioInputProps): VNode {
  const { utils } = useBlock();
  const { help, label, options, tag } = field;
  const required = isRequired(field, utils, formValues);
  const value = getValueByNameSequence(name, formValues);

  return (
    <RadioGroup
      className={classNames('appsemble-radio', className)}
      disabled={disabled}
      error={dirty ? error : null}
      help={utils.remap(help, value) as string}
      label={utils.remap(label, value) as string}
      name={name}
      onChange={onChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      required={required}
      tag={utils.remap(tag, value) as string}
      value={value}
    >
      {options.map((option, index) => {
        const id = `${name}.${index}`;
        return (
          <RadioButton
            disabled={disabled}
            icon={option.icon}
            id={id}
            key={id}
            readOnly={readOnly}
            required={required}
            value={option.value}
            wrapperClassName={styles.choice}
          >
            {(utils.remap(option.label, {}) ?? option.value) as string}
          </RadioButton>
        );
      })}
    </RadioGroup>
  );
}
