import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type FooterItem } from '../../../block.js';

export function FooterListItem({ item }: { item: FooterItem }): VNode | null {
  const {
    actions,
    data,
    parameters: { linkColor, textColor },
    utils: { remap },
  } = useBlock();
  const hide = remap(item.hide, data);

  if (hide) {
    return null;
  }

  const label = remap(item.label, data) as string;
  const action = item.onClick ? actions[item.onClick] : undefined;
  const content = (
    <>
      {item.icon ? (
        <span aria-hidden="true" className="mr-1">
          <Icon icon={item.icon} />
        </span>
      ) : null}
      {label}
    </>
  );

  if (!action) {
    return (
      <li>
        <div className={classNames(textColor && `has-text-${textColor}`)}>{content}</div>
      </li>
    );
  }

  const className = classNames(linkColor && `has-text-${linkColor}`);
  const onClick = async (event: Event): Promise<void> => {
    // Delegate anchor behavior to the link action.
    event.preventDefault();
    await action(data);
  };

  return (
    <li>
      {action.type === 'link' ? (
        <a className={className} href={action.href(data)} onClick={onClick}>
          {content}
        </a>
      ) : (
        <button className={classNames(styles.link, className)} onClick={onClick} type="button">
          {content}
        </button>
      )}
    </li>
  );
}
