import { useBlock } from '@appsemble/preact';
import { Select } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { EnumField, FieldComponentProps } from '../../../block';

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
      {field.enum.map(({ label, value: val }) => (
        <option key={val} selected={value === val} value={val}>
          {utils.remap(label, {}) || val}
        </option>
      ))}
    </Select>
  );
}
