import { useBlock } from '@appsemble/preact';
import { DualSlider } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import styles from './index.module.css';
import { type FieldComponentProps, type RangeField } from '../../../block.js';

/**
 * An input element for a number type schema.
 */
export function RangeFieldComponent({
  className,
  field,
  highlight,
  loading,
  onChange,
  value,
}: FieldComponentProps<RangeField>): VNode {
  const { utils } = useBlock();
  const { from, to } = field;
  const [topLabel, setTopLabel] = useState('');

  useEffect(() => {
    const minValue = utils.remap(from, {}) || 0;
    const maxValue = utils.remap(to, {}) || 100;

    setTopLabel(`${minValue} - ${maxValue}`);
  }, [from, to, utils]);

  useEffect(() => {
    if (value) {
      const maxValue = Number(value[1]);
      const minValue = Number(value[0]);

      setTopLabel(`${minValue} - ${maxValue}`);
    }
  }, [value]);

  const handleChange = useCallback(
    (event: Event & { currentTarget: any }, values: [number, number]) => {
      const parsedValues: [number, number] = [Number(values[0]), Number(values[1])];

      onChange(event, parsedValues);
    },
    [onChange],
  );

  return (
    <div
      className={classNames('is-flex', 'is-flex-direction-column', 'field', className, {
        'is-loading': loading,
        [styles.highlight]: highlight,
      })}
    >
      <div class="is-flex is-justify-content-flex-end">
        <span key={topLabel}>{topLabel}</span>
      </div>
      <DualSlider
        from={utils.remap(from, {}) as number}
        id={field.name}
        name={field.name}
        onChange={handleChange}
        to={utils.remap(to, {}) as number}
      />
    </div>
  );
}
