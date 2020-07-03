import { useBlock } from '@appsemble/preact/src';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { EnumField, FieldComponentProps } from '../../../block';

export default function EnumFieldComponent({
  field,
  highlight,
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
    <div
      className={classNames('select is-fullwidth my-2', {
        'is-loading': loading,
        'mx-2': highlight,
      })}
    >
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
