import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

interface JSONSchemaLabelProps {
  /**
   * The name of the property thas is being rendered.
   */
  name: string;

  /**
   * The prefix to remove from the field name.
   */
  prefix: string;

  /**
   * The schema used to render the label.
   */
  schema: OpenAPIV3.SchemaObject;
}

export default function JSONSchemaLabel({
  name,
  prefix,
  schema,
}: JSONSchemaLabelProps): React.ReactElement {
  return (schema?.title ? (
    <>
      {`${schema.title} `}
      <span className="has-text-weight-normal has-text-grey-light">
        ({name.slice(prefix.length + 1)})
      </span>
    </>
  ) : (
    name.slice(prefix.length + 1)
  )) as React.ReactElement;
}
