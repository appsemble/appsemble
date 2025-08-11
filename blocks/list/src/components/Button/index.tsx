import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useMemo } from 'preact/hooks';

import { type Button } from '../../../block.js';

interface ButtonComponentProps {
  readonly field: Button;

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

export function ButtonComponent({
  field: {
    color,
    fullwidth,
    icon,
    inverted,
    label,
    light,
    outlined,
    rounded,
    size = 'normal',
    title,
    ...field
  },
  index,
  item,
  onItemClick,
}: ButtonComponentProps): VNode {
  const {
    utils: { isMobile, remap },
  } = useBlock();

  const disabled = useMemo(
    () => Boolean(remap(field.disabled, item, { index })),
    [field.disabled, index, item, remap],
  );
  const className = classNames('button', `is-${isMobile ? 'small' : size}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });
  const remappedTitle = remap(title, item, { index }) as string;

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} size={isMobile ? 'small' : size} /> : null}
      {label && !isMobile ? <span>{remap(label, item, { index }) as string}</span> : null}
    </Fragment>
  );

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onItemClick}
      title={remappedTitle}
      type="button"
    >
      {content}
    </button>
  );
}
