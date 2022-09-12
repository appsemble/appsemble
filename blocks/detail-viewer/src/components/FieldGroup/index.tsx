import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { FieldGroup as FieldGroupType, RendererProps } from '../../../block.js';
import { Field } from '../Field/index.js';

/**
 * Renders a group of fields.
 */
export function FieldGroup({ data, field }: RendererProps<FieldGroupType>): VNode {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);

  return (
    <div className="appsemble-group">
      {isPreactChild(label) ? <h5 className="title is-5">{label}</h5> : null}
      {Array.isArray(value)
        ? value.flatMap((val) =>
            field.fields.map((subField, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Field data={val} field={subField} key={index} />
            )),
          )
        : field.fields.map((subField, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Field data={value} field={subField} key={index} />
          ))}
    </div>
  );
}
