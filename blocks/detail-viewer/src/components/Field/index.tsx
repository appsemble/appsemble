import { type VNode } from 'preact';

import { type Field as FieldType, type RendererProps } from '../../../block.js';
import { FileRenderer } from '../FileRenderer/index.js';
import { GeoCoordinatesRenderer } from '../GeoCoordinatesRenderer/index.js';
import { StringRenderer } from '../StringRenderer/index.js';

const renderers = {
  file: FileRenderer,
  geocoordinates: GeoCoordinatesRenderer,
  string: StringRenderer,
};

/**
 * Renders a field.
 */
export function Field({ data, field }: RendererProps<FieldType>): VNode {
  // Always default to string if type is not supported in renderers list.
  const Comp = renderers[field.type] || renderers.string;

  return (
    <Comp
      data={data}
      // @ts-expect-error XXX This should be fine
      field={field}
    />
  );
}
