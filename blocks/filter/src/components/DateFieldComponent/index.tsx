import { Input } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { type DateField, type FieldComponentProps } from '../../../block.js';

export function DateFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<DateField>): VNode {
  return (
    <Input
      className={className}
      loading={loading}
      name={field.name}
      onChange={onChange}
      type="date"
      value={value}
    />
  );
}
