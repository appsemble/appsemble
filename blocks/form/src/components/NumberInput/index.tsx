import { FormattedMessage, useBlock } from '@appsemble/preact';
import { InputField, SliderField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { VNode } from 'preact';

import { InputProps, NumberField } from '../../../block.js';
import { getMax, getMin, getStep } from '../../utils/requirements.js';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export function NumberInput({
  className,
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  required,
  value,
}: NumberInputProps): VNode {
  const { utils } = useBlock();
  const { bottomLabels, display, icon, inline, label, placeholder, readOnly, tag, topLabels } =
    field;

  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames('appsemble-number', className),
    disabled,
    error: dirty && error,
    icon,
    label: remappedLabel as string,
    max: getMax(field),
    min: getMin(field),
    name,
    onChange,
    optionalLabel: <FormattedMessage id="optionalLabel" />,
    readOnly,
    required,
    step: getStep(field),
    tag: utils.remap(tag, value) as string,
    value,
    inline,
  };

  if (display === 'slider') {
    return (
      <SliderField
        {...commonProps}
        bottomLabels={bottomLabels?.map((bottomLabel) => utils.remap(bottomLabel, value) as string)}
        onChange={onChange}
        topLabels={topLabels?.map((topLabel) => utils.remap(topLabel, value) as string)}
      />
    );
  }

  return (
    <InputField
      icon={icon}
      placeholder={
        (utils.remap(placeholder, value) as string) ||
        (utils.remap(label, value) as string) ||
        field.name
      }
      type="number"
      {...commonProps}
    />
  );
}
