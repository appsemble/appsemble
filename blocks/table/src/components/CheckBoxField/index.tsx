import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useMemo } from 'preact/hooks';

import { type CheckBox as CheckBoxFieldType } from '../../../block.js';

interface CheckBoxFieldPropsInterface {
  readonly field: CheckBoxFieldType;
  readonly onChange: (event: Event | string, value: boolean) => void;

  /**
   * The data to display.
   */
  readonly item: unknown;

  /**
   * The index of the row that was selected.
   */
  readonly index: number;
}

export function CheckBoxField({
  field: { checkbox },
  index,
  item,
  onChange,
}: CheckBoxFieldPropsInterface): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const disabled = useMemo(
    () => Boolean(remap(checkbox.disabled, item, { index })),
    [checkbox.disabled, index, item, remap],
  );
  return (
    <span>
      <label className={classNames('checkbox')}>
        <input
          disabled={disabled}
          onChange={(event) => onChange(event, event.currentTarget.checked)}
          type="checkbox"
        />
        {}
      </label>
    </span>
  );
}
