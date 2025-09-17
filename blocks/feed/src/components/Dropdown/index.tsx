import { useBlock } from '@appsemble/preact';
import { Dropdown } from '@appsemble/preact-components';
import { Fragment, type VNode } from 'preact';

import { type Dropdown as DropdownInterface } from '../../../block.js';
import { DropdownOption } from '../DropdownOption/index.js';

interface DropdownComponentProps {
  /**
   * The content for this specific card to render.
   */
  readonly content: {
    id: number;
    status: string;
    photos: string[];
  };

  /**
   * The dropdown definition.
   */
  readonly dropdown: DropdownInterface | undefined;
}

export function DropdownComponent({ content, dropdown }: DropdownComponentProps): VNode {
  const {
    utils: { remap },
  } = useBlock();

  return (
    <Dropdown
      asButton={false}
      icon={dropdown?.icon}
      iconClassName="is-justify-content-end is-align-items-end"
      label={remap(dropdown?.label, content, content) as string}
    >
      {dropdown?.options.map((option, i) => {
        const label = remap(option.label, content, content);

        return (
          <Fragment key={label || i}>
            {i ? <hr className="dropdown-divider" /> : null}
            <DropdownOption index={content.id} item={content} option={option} />
          </Fragment>
        );
      })}
    </Dropdown>
  );
}
