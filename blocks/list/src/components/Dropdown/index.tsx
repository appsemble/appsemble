import { useBlock } from '@appsemble/preact';
import { Dropdown } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';

import { type Dropdown as Field } from '../../../block.js';
import { DropdownOption } from '../DropdownOption/index.js';

interface DropdownComponentProps {
  /**
   * The definition used to render out the field.
   */
  readonly field: Field;

  /**
   * The data to display.
   */
  readonly item: unknown;

  /**
   * The index of the row that was clicked.
   */
  readonly index: number;

  /**
   * The data of the record that item is a part of.
   */
  readonly record: unknown;
}

export function DropdownComponent({ field, index, item, record }: DropdownComponentProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  return (
    <Dropdown
      asButton={false}
      icon={field.icon}
      iconClassName="is-align-items-center p-4 box"
      label={remap(field.label, item, { index }) as string}
    >
      {field.options.map((option, i) => {
        const label = remap(option.label, item, { index });

        return (
          <Fragment key={label || i}>
            {i ? <hr className="dropdown-divider" /> : null}
            <DropdownOption index={index} item={item} option={option} record={record} />
          </Fragment>
        );
      })}
    </Dropdown>
  );
}
