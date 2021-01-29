import { useBlock } from '@appsemble/preact';
import { VNode } from 'preact';

import { RendererProps, StringField } from '../../../block';

/**
 * An element for a text type schema.
 */
export function StringRenderer({ data, field }: RendererProps<StringField>): VNode {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);

  return (
    <div className="appsemble-string">
      {label ? <h6 className="title is-6">{label}</h6> : null}
      {value ? (
        <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      ) : null}
    </div>
  );
}
