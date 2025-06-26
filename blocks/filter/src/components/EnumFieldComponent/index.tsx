import { useBlock } from '@appsemble/preact';
import { Option, Select } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { type EnumField, type FieldComponentProps } from '../../../block.js';

export function EnumFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<EnumField>): VNode {
  const { utils } = useBlock();

  return (
    <Select
      className={className}
      fullWidth
      loading={loading}
      name={field.name}
      onChange={onChange}
      value={value}
    >
      {field.enum.map(({ label, value: val }) => {
        const remappedValue = utils.remap(val, {});
        return (
          <Option
            key={val}
            value={
              Array.isArray(remappedValue) ? remappedValue.join(', ') : (remappedValue as string)
            }
          >
            {(utils.remap(label, {}) as string) || (remappedValue as string)}
          </Option>
        );
      })}
    </Select>
  );
}
