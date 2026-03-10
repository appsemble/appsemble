import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type VNode } from 'preact';

import { type FooterColumnWithLinks } from '../../../block.js';
import { FooterListItem } from '../FooterListItem/index.js';

export function FooterListColumn({ column }: { column: FooterColumnWithLinks }): VNode {
  const {
    parameters: { textColor },
    utils: { remap },
  } = useBlock();
  const title = remap(column.title ?? null, {}) as string;
  return (
    <div class="column">
      {title ? (
        <p
          class={classNames(
            'title',
            `is-${column.titleLevel ?? 4}`,
            textColor && `has-text-${textColor}`,
          )}
        >
          {title}
        </p>
      ) : null}
      <ul>{column.items?.map((item) => <FooterListItem item={item} />)}</ul>
    </div>
  );
}
