import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type SelectionChoice } from '../../../../block.js';
import { Image } from '../Image/index.js';

interface HeaderProps {
  readonly index: number;
  readonly option: SelectionChoice;
}

export function Header({ index, option }: HeaderProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const { fields, header, icon, image } = option;

  const headerValue = remap(header, option);

  const headerHTML = (
    <div className={classNames({ [styles.header]: fields?.length })}>
      {isPreactChild(icon) ? <Icon icon={icon} /> : null}
      {isPreactChild(headerValue) ? <h4>{headerValue}</h4> : null}
    </div>
  );

  return (
    <div className={`${styles.headerWrapper} is-flex`}>
      <div className={`is-flex ${styles.image}`}>
        <div>
          {image && image.alignment === 'header' ? (
            <Image image={image} index={index} option={option} />
          ) : null}
        </div>
        <div className={`${styles.item} has-text-left is-block`}>{headerHTML}</div>
      </div>
    </div>
  );
}
