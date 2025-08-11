import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';

import { type ToggleButton } from '../../../block.js';
import { ButtonComponent } from '../Button/index.js';

interface ToggleButtonComponentProps {
  readonly field: ToggleButton;

  /**
   * The data to display.
   */
  readonly item: unknown;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  readonly onItemClick: (event: Event) => void;
}

export function ToggleButtonComponent({
  field: { falseButton, trueButton, value },
  index,
  item,
  onItemClick,
}: ToggleButtonComponentProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const val = remap(value, item, { index }) as string;

  return val ? (
    <ButtonComponent field={trueButton} index={index} item={item} onItemClick={onItemClick} />
  ) : (
    <ButtonComponent field={falseButton} index={index} item={item} onItemClick={onItemClick} />
  );
}
