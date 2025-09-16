import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { type Button as ButtonFieldType } from '../../../block.js';

interface ButtonFieldProps {
  readonly field: ButtonFieldType;

  /**
   * The data to display.
   */
  readonly item: unknown;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The index of the sub row that was clicked.
   */
  readonly repeatedIndex: number;
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
  const action = field.onClick ? actions[field.onClick] : actions.onClick;
  const className = classNames('button', `is-${size}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });
  const remappedTitle = remap(title, item, { index, repeatedIndex }) as string;
  const remappedLabel = remap(label, item, { index, repeatedIndex }) as string;

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} /> : null}
      {remappedLabel ? <span>{remappedLabel}</span> : null}
    </Fragment>
  );

  const onClick = useCallback(() => {
    if (disabled) {
      return;
    }

    action(item, { index, repeatedIndex });
  }, [action, disabled, item, index, repeatedIndex]);

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
