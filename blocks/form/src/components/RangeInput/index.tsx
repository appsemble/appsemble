import { useBlock } from '@appsemble/preact';
import { DualSliderField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { type MutableRef, useEffect, useState } from 'preact/hooks';

import { type InputProps, type RangeField } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMax, getMin, getStep, isRequired } from '../../utils/requirements.js';

type RangeInputProps = InputProps<[number, number], RangeField>;

/**
 * An input element for a number type schema.
 */
export function RangeInput({
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
}: RangeInputProps): VNode {
  const { utils } = useBlock();
  const { bottomLabels, from, help, icon, inline, label, tag, to, topLabels } = field;
  const [customTopLabels, setCustomTopLabels] = useState(topLabels || ['']);

  const value = getValueByNameSequence(name, formValues) as string;
  const remappedLabel = utils.remap(label, value) ?? name;
  const commonProps = {
    className: classNames('appsemble-number', className),
    disabled,
    error: dirty && error,
    help: utils.remap(help, value) as string,
    icon,
    label: remappedLabel as string,
    max: String(getMax(field)),
    min: String(getMin(field)),
    name,
    onChange,
    optionalLabel: utils.formatMessage('optionalLabel'),
    readOnly,
    required: isRequired(field, utils, formValues),
    step: getStep(field),
    tag: utils.remap(tag, value) as string,
    value,
    inline,
    from: utils.remap(from, value) as number,
    to: utils.remap(to, value) as number,
  };

  useEffect(() => {
    const minValue = String(commonProps.from || 0);
    const maxValue = String(commonProps.to || 100);

    setCustomTopLabels((prevValues) => [...prevValues, `${minValue} | ${maxValue}`]);
  }, [commonProps.from, commonProps.to]);

  useEffect(() => {
    const minValue = Number(commonProps.value?.[0] || commonProps.from);
    const maxValue = Number(commonProps.value?.[1] || commonProps.to);

    setCustomTopLabels((prevValues) => {
      const values = [...prevValues];
      values[values.length - 1] = `${Math.round(minValue)} | ${Math.round(maxValue)}`;
      return values;
    });
  }, [commonProps.from, commonProps.to, commonProps.value]);

  return (
    <DualSliderField
      {...commonProps}
      bottomLabels={bottomLabels?.map((bottomLabel) => utils.remap(bottomLabel, value) as string)}
      errorLinkRef={(errorLinkRef as MutableRef<HTMLElement>) || undefined}
      topLabels={customTopLabels?.map((topLabel) => utils.remap(topLabel, value) as string)}
    />
  );
}
