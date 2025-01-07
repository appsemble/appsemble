import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import styles from './index.module.css';
import { type Field, type Item } from '../../../../block.js';
import { ButtonComponent } from '../../Button/index.js';
import { DropdownComponent } from '../../Dropdown/index.js';

interface ContentComponentProps {
  readonly index: number;
  readonly item: Item;
}

export function ContentComponent({ index, item }: ContentComponentProps): VNode {
  const {
    actions,
    parameters: { button, dropdown, fields },
    utils: { remap },
  } = useBlock();

  const onItemClick = useCallback(
    (event: Event) => {
      event.preventDefault();
      actions.onClick(item);
    },
    [actions, item],
  );

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
      {button && button.alignment === 'field' ? (
        <ButtonComponent field={button} index={index} item={item} />
      ) : null}
    </div>
  );

  return (
    <div>
      {fields?.map((field) => {
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
              <a
                className={`${styles.item} has-text-left is-block`}
                href={actions.onClick.href(item)}
              >
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
            {dropdown && dropdown.alignment === 'bottom-right' ? (
              <div className={styles.dropdown}>
                <DropdownComponent field={dropdown} index={index} item={item} record={item} />
              </div>
            ) : null}
            {button && button.alignment === 'bottom-right' ? (
              <div className={styles.dropdown}>
                <ButtonComponent field={button} index={index} item={item} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
