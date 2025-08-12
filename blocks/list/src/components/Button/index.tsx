import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { type Button, type Item } from '../../../block.js';

interface ButtonComponentProps {
  readonly field: Button;

  /**
   * The data to display.
   */
  readonly item: Item;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;
}

export function ButtonComponent({
  field: {
    color,
    fullwidth,
    icon,
    inverted,
    label,
    light,
    onClick,
    outlined,
    rounded,
    size = 'normal',
    title,
    ...field
  },
  index,
  item,
}: ButtonComponentProps): VNode {
  const {
    actions,
    pathIndex,
    utils: { isMobile, remap },
  } = useBlock();

  const disabled = useMemo(
    () => Boolean(remap(field.disabled, item, { index })),
    [field.disabled, index, item, remap],
  );

  const handleClick = useCallback(async () => {
    // We take the onClick action name specified in the button, wherever the button is
    const action = actions[onClick];
    if (action.type === 'link') {
      window.location.hash = `${pathIndex}.item.${item.id}`;
    }
    await action(item, { index });
  }, [actions, index, item, onClick, pathIndex]);

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
      onClick={handleClick}
      title={remappedTitle}
      type="button"
    >
      {content}
    </button>
  );
}
