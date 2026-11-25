import { useBlock } from '@appsemble/preact';
import { Input } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type DateRangeField, type FieldComponentProps } from '../../../block.js';

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
      // @ts-expect-error strictNullChecks undefined is not assignable
      onChange(event, [event.currentTarget.value, value?.[1]]);
    },
    [onChange, value],
  );

  const onChangeTo = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      // @ts-expect-error strictNullChecks undefined is not assignable
      onChange(event, [value?.[0], event.currentTarget.value]);
    },
    [onChange, value],
  );

  const fromLabel = field.fromLabel
    ? (utils.remap(field.fromLabel, {}) as string)
    : utils.formatMessage('fromLabel');
  const toLabel = field.toLabel
    ? (utils.remap(field.toLabel, {}) as string)
    : utils.formatMessage('toLabel');

  return (
    <fieldset
      aria-labelledby={`${field.name}-label`}
      className={classNames(
        `field is-align-items-center is-grouped ${className} ${styles.fieldset}`,
        {
          'is-loading': loading,
          [styles.highlight]: highlight,
        },
      )}
    >
      <Input
        aria-label={fromLabel}
        className={styles.input}
        name={field.name}
        onChange={onChangeFrom}
        placeholder={fromLabel}
        type="date"
        value={value?.[0]}
      />
      <div>{utils.remap(field.separator ?? 'to', {}) as string}</div>
      <Input
        aria-label={toLabel}
        className={styles.input}
        name={field.name}
        onChange={onChangeTo}
        placeholder={toLabel}
        type="date"
        value={value?.[1]}
      />
    </fieldset>
  );
}
