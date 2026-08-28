import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';

import { type FooterColumnWithLinks } from '../../../block.js';
import { FooterListItem } from '../FooterListItem/index.js';

export function FooterListColumn({ column }: { column: FooterColumnWithLinks }): VNode {
  const {
    data,
    parameters: { textColor },
    utils: { remap },
  } = useBlock();
  const title = remap(column.title ?? null, data) as string;
  const Title = `h${column.titleLevel ?? 4}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return (
    <div>
      {title ? (
        <Title
          class={classNames(
            'title',
            `is-${column.titleLevel ?? 4}`,
            textColor && `has-text-${textColor}`,
          )}
        >
          {title}
        </Title>
      ) : null}
      <ul>
        {column.items?.map((item, index) => (
          <FooterListItem item={item} key={index} />
        ))}
      </ul>
    </div>
  );
}
