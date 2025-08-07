import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

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

  /**
   * Class names to apply to the button.
   */
  classname?: string;
}

export function ButtonComponent({
  classname,
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
}: ButtonComponentProps): VNode {
  const {
    actions,
    utils: { isMobile, remap },
  } = useBlock();

  const disabled = useMemo(
    () => Boolean(remap(field.disabled, item, { index })),
    [field.disabled, index, item, remap],
  );
  const hide = useMemo(
    () => Boolean(remap(field.hide ?? null, item, { index })),
    [field.hide, item, index, remap],
  );
  const action = actions[field.onClick];
  const className = classNames('button', classname, `is-${isMobile ? 'small' : size}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });
  const remappedTitle = remap(title, item, { index }) as string;
  if (hide) {
    return null;
  }

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} size={isMobile ? 'small' : size} /> : null}
      {label && !isMobile ? <span>{remap(label, item, { index }) as string}</span> : null}
    </Fragment>
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) {
        return;
      }

      action(item, { index });
    },
    [action, disabled, item, index],
  );

  return (
    <button
      className={className}
      disabled={disabled}
      onClick={onClick}
      title={remappedTitle}
      type="button"
    >
      {content}
    </button>
  );
}
