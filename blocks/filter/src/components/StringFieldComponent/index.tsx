import { Input } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { FieldComponentProps, StringField } from '../../../block';

export function StringFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<StringField>): VNode {
  return (
    <Input
      className={className}
      loading={loading}
      name={field.name}
      onChange={onChange}
      value={value}
    />
  );
}
