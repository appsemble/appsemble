import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';

import { type Item, type ToggleButton } from '../../../block.js';
import { ButtonComponent } from '../Button/index.js';

interface ToggleButtonComponentProps {
  readonly field: ToggleButton;

  /**
   * The data to display.
   */
  readonly item: Item;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;
}

export function ToggleButtonComponent({
  field: { falseButton, trueButton, value },
  index,
  item,
}: ToggleButtonComponentProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const val = remap(value, item, { index }) as string;

  return val ? (
    <ButtonComponent field={trueButton} index={index} item={item} />
  ) : (
    <ButtonComponent field={falseButton} index={index} item={item} />
  );
}
