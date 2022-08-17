import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { Button as ButtonFieldType } from '../../../block.js';

interface ButtonFieldProps {
  field: ButtonFieldType;
  /**
   * The data to display.
   */
  item: unknown;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the subrow that was clicked.
   */
  repeatedIndex: number;
}

export function ButtonField({
  field: {
    button: {
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
      ...button
    },
    ...field
  },
  index,
  item,
  repeatedIndex,
}: ButtonFieldProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();

  const disabled = useMemo(
    () => Boolean(remap(button.disabled, item, { index, repeatedIndex })),
    [button.disabled, index, item, remap, repeatedIndex],
  );
  const action = actions[field.onClick];
  const className = classNames('button', `is-${size}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });
  const remappedTitle = remap(title, item, { index, repeatedIndex }) as string;

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} /> : null}
      <span>{remap(label, item, { index, repeatedIndex }) as string}</span>
    </Fragment>
  );

  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }

    action(item);
  }, [action, disabled, item]);

  return action?.type === 'link' ? (
    <a
      className={className}
      disabled={disabled}
      href={action.href()}
      onClick={onClick}
      title={remappedTitle}
    >
      {content}
    </a>
  ) : (
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
