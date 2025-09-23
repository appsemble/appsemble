import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type Field, type Item } from '../../../../block.js';
import { Image } from '../Image/index.js';

interface ContentComponentProps {
  readonly index: number;
  readonly item: Item;
  readonly isVisible: boolean;
  readonly onItemClick: (event: Event) => void;
  readonly itemHref: string | undefined;
}

export function ContentComponent({
  index,
  isVisible,
  item,
  itemHref,
  onItemClick,
}: ContentComponentProps): VNode {
  const {
    actions,
    parameters: {
      item: { content },
    },
    utils: { remap },
  } = useBlock();

  const contentHTML = (field: Field, label: unknown, value: unknown): VNode => (
    <div className={`${styles.fieldWrapper} is-flex`}>
      <span className={`${styles.itemField} mr-1 is-inline-block`}>
        {field.icon ? <Icon icon={field.icon} /> : null}
        {label == null ? null : (
          <span>
            {label}
            {value ? ': ' : null}
          </span>
        )}
        {value ? (
          <strong className="has-text-bold">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </strong>
        ) : null}
      </span>
    </div>
  );

  return (
    <div>
      {content && 'image' in content ? (
        <figure className={`image ${styles.image}`}>
          <Image field={content.image} index={index} isVisible={isVisible} item={item} />
        </figure>
      ) : null}
      {content && 'fields' in content
        ? content.fields?.map((field) => {
            let value;
            let label;

            if (field.value) {
              value = remap(field.value, item);
            }

            if (field.label) {
              label = remap(field.label, item);
            }

            return (
              // There is nothing that is guaranteed to be unique in these items.
              <div className={`${styles.fieldWrapper} is-flex`} key={0}>
                {actions.onClick.type === 'link' ? (
                  <a className={`${styles.item} has-text-left is-block`} href={itemHref}>
                    {contentHTML(field, label, value)}
                  </a>
                ) : (
                  <button
                    className={`${styles.item} has-text-left is-block`}
                    onClick={onItemClick}
                    type="button"
                  >
                    {contentHTML(field, label, value)}
                  </button>
                )}
              </div>
            );
          })
        : null}
    </div>
  );
}
