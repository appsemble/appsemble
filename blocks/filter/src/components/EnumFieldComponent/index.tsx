import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { EnumField, FieldComponentProps } from '../../../block';

export function EnumFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<EnumField>): VNode {
  const { utils } = useBlock();
  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLSelectElement>) => onChange(event, event.currentTarget.value),
    [onChange],
  );

  return (
    <div className={classNames(`select is-fullwidth ${className}`, { 'is-loading': loading })}>
      <select name={field.name} onChange={handleChange} value={value}>
        {field.enum.map(({ label, value: val }) => (
          <option key={val} selected={value === val} value={val}>
            {utils.remap(label, {}) || val}
          </option>
        ))}
      </select>
    </div>
  );
}
