import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { Fragment, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { Button as ButtonFieldType } from '../../../block';

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
    button: { color, fullwidth, icon, inverted, label, light, outlined, rounded, size = 'normal' },
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

  const action = actions[field.onClick];
  const className = classNames('button', `is-${size}`, {
    'is-rounded': rounded,
    'is-fullwidth': fullwidth,
    [`is-${color}`]: color,
    'is-light': light,
    'is-inverted': inverted,
    'is-outlined': outlined,
  });

  const content = (
    <Fragment>
      {icon ? <Icon icon={icon} /> : null}
      <span>{remap(label, item, { index, repeatedIndex }) as string}</span>
    </Fragment>
  );

  const onClick = useCallback(() => {
    action(item);
  }, [action, item]);

  return action?.type === 'link' ? (
    <a className={className} href={action.href()} onClick={onClick}>
      {content}
    </a>
  ) : (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  );
}
