import { h, VNode } from 'preact';

import type { Field as FieldType, RendererProps } from '../../../block';
import { FileRenderer } from '../FileRenderer';
import { GeoCoordinatesRenderer } from '../GeoCoordinatesRenderer';
import { StringRenderer } from '../StringRenderer';

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
