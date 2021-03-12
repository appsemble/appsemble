import { useBlock } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import classNames from 'classnames';
import { JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { DateRangeField, FieldComponentProps } from '../../../block';
import styles from './index.module.css';

export function DateRangeFieldComponent({
  className,
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<DateRangeField>): VNode {
  const { utils } = useBlock();

  const onChangeFrom = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, [event.currentTarget.value, value[1]]);
    },
    [onChange, value],
  );

  const onChangeTo = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, [value[0], event.currentTarget.value]);
    },
    [onChange, value],
  );

  return (
    <div
      className={classNames(`field is-grouped ${className}`, {
        'is-loading': loading,
        [styles.highlight]: highlight,
      })}
    >
      <Input
        className={styles.input}
        name={field.name}
        onChange={onChangeFrom}
        placeholder={utils.remap(field.fromLabel ?? 'From', {})}
        type="date"
        value={value[0]}
      />
      <Input
        className={styles.input}
        name={field.name}
        onChange={onChangeTo}
        placeholder={utils.remap(field.toLabel ?? 'To', {})}
        type="date"
        value={value[1]}
      />
    </div>
  );
}
