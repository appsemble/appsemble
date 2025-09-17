import { useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type MutableRef } from 'preact/hooks';

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
  errorLinkRef,
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
      error={dirty ? error : null}
      errorLinkRef={(errorLinkRef as MutableRef<HTMLElement>) ?? undefined}
      help={utils.remap(help, value) as string}
      label={(utils.remap(label, value) as string) ?? name}
      name={name}
      onChange={onChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      required={required}
      tag={utils.remap(tag, value) as string}
      value={value}
    >
      {(options ?? []).map((option, index) => {
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
