import { useBlock } from '@appsemble/preact';
import { Icon } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import styles from './index.module.css';
import { type SelectionChoice, type SelectionChoiceField } from '../../../../block.js';

interface ContentProps {
  readonly option: SelectionChoice;
}

export function Content({ option }: ContentProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  const { fields } = option;

  const contentHTML = (field: SelectionChoiceField, label: unknown, value: unknown): VNode => (
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
      {fields?.map((field) => {
        let value;
        let label;

        if (field.value) {
          value = remap(field.value, option);
        }

        if (field.label) {
          label = remap(field.label, option);
        }

        return (
          // There is nothing that is guaranteed to be unique in these items.
          <div className={`${styles.fieldWrapper} is-flex`} key={0}>
            <div className={`${styles.item} has-text-left is-block`}>
              {contentHTML(field, label, value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
