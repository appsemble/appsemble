import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { DateRangeField, FieldComponentProps } from '../../../block';
import styles from './index.css';

export default function DateRangeFieldComponent({
  className,
  field,
  loading,
  onChange,
  value,
}: FieldComponentProps<DateRangeField>): VNode {
  const { utils } = useBlock();

  const onChangeFrom = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, [event.currentTarget.value, value[1]]);
    },
    [onChange, value],
  );

  const onChangeTo = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, [value[0], event.currentTarget.value]);
    },
    [onChange, value],
  );

  return (
    <div
      className={classNames(`field is-grouped ${styles.root} ${className}`, {
        'is-loading': loading,
      })}
    >
      <input
        className={`input ${styles.input}`}
        name={field.name}
        onChange={onChangeFrom}
        placeholder={utils.remap(field.fromLabel ?? 'From', {})}
        type="date"
        value={value[0]}
      />
      <input
        className={`input ${styles.input}`}
        name={field.name}
        onChange={onChangeTo}
        placeholder={utils.remap(field.toLabel ?? 'To', {})}
        type="date"
        value={value[1]}
      />
    </div>
  );
}
