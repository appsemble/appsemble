/** @jsx h */
import { Fragment, h, VNode } from 'preact';

import { RendererProps, StringField } from '../../../../block';

/**
 * An element for a text type schema.
 */
export default function StringRenderer({ field, value = '' }: RendererProps<StringField>): VNode {
  return (
    <Fragment>
      <h6 className="title is-6">{field.label || field.name}</h6>
      <div className="content">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
    </Fragment>
  );
}
