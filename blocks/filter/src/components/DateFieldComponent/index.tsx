import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { DateField, FieldComponentProps } from '../../../block';

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
