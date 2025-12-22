import { useBlock } from '@appsemble/preact';
import { Button, Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';
import { useMemo } from 'preact/hooks';

import { type FooterItem } from '../../../block.js';

export function FooterListItem({ item }: { item: FooterItem }): VNode | null {
  const {
    actions,
    data,
    parameters: { linkColor, textColor },
    utils: { remap },
  } = useBlock();
  const itemHref = useMemo(() => {
    if (!item.onClick) {
      return null;
    }
    const onClick = actions[item.onClick];
    if (onClick.type === 'link') {
      return onClick.href(item);
    }
  }, [actions.onClick, item]);
  const label = remap(item.label, data) as string;
  const hide = remap(item.hide, data);

  return hide ? null : (
    <li>
      {item.icon ? <Icon icon={item.icon} /> : null}
      {item.onClick ? null : (
        <div className={classNames(textColor && `has-text-${textColor}`)}>{label}</div>
      )}
      {itemHref ? (
        <a className={classNames(linkColor && `has-text-${linkColor}`)} href={itemHref}>
          {label}
        </a>
      ) : (
        <Button onClick={actions[item.onClick!]}>{label}</Button>
      )}
    </li>
  );
}
