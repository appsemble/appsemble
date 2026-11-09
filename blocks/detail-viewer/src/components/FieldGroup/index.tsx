import { useBlock } from '@appsemble/preact';
import { isPreactChild } from '@appsemble/preact-components';
import { type VNode } from 'preact';

import { type FieldGroup as FieldGroupType, type RendererProps } from '../../../block.js';
import { Field } from '../Field/index.js';

/**
 * Renders a group of fields.
 */
export function FieldGroup({ data, field }: RendererProps<FieldGroupType>): VNode | null {
  const { utils } = useBlock();

  const label = utils.remap(field.label, data);
  const value = utils.remap(field.value, data);
  const hide = utils.remap(field.hide, data);
  const Heading = `h${field.labelLevel ?? 5}` as const;

  return hide ? null : (
    <div className="appsemble-group">
      {isPreactChild(label) ? <Heading className="title is-5">{label}</Heading> : null}
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
