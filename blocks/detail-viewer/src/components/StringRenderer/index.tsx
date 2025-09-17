import { useBlock } from '@appsemble/preact';
import { Icon, isPreactChild } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { type RendererProps, type StringField } from '../../../block.js';

/**
 * An element for a text type schema.
 */
export function StringRenderer({ data, field }: RendererProps<StringField>): VNode | null {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);
  const hide = utils.remap(field.hide, data);

  return hide ? null : (
    <div className="appsemble-string mb-5">
      {isPreactChild(label) ? <h6 className="title is-6 mb-0">{label}</h6> : null}
      {value ? (
        <>
          {field.icon ? <Icon icon={field.icon} /> : null}
          <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
        </>
      ) : null}
    </div>
  );
}
