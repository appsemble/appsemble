import type { OpenAPIV3 } from 'openapi-types';
import * as React from 'react';

import type { NamedEvent } from '../../../../types';
import JSONSchemaArrayEditor from '../JSONSchemaArrayEditor';
import JSONSchemaBooleanEditor from '../JSONSchemaBooleanEditor';
import JSONSchemaEnumEditor from '../JSONSchemaEnumEditor';
import JSONSchemaObjectEditor from '../JSONSchemaObjectEditor';
import JSONSchemaStringEditor from '../JSONSchemaStringEditor';
import JSONSchemaUnknownEditor from '../JSONSchemaUnknownEditor';

interface RecursiveJSONSchemaEditorProps {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name: string;

  /**
   * Whether or not this is a nested component.
   */
  nested?: boolean;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: NamedEvent, value?: any) => void;

  /**
   * The prefix to remove from labels.
   */
  prefix: string;

  /**
   * Whether or not the property is required.
   *
   * This is determined by the parent schema. It is used for recursion.
   */
  required?: boolean;

  /**
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The value used to populate the editor.
   */
  value: any;
}

export default function RecursiveJSONSchemaEditor(
  props: RecursiveJSONSchemaEditorProps,
): React.ReactElement {
  const { schema } = props;

  if (schema.enum) {
    return <JSONSchemaEnumEditor {...props} />;
  }

  switch (schema.type) {
    case 'array':
      return <JSONSchemaArrayEditor {...props} />;
    case 'boolean':
      return <JSONSchemaBooleanEditor {...props} />;
    case 'object':
      return <JSONSchemaObjectEditor {...props} />;
    case 'string':
    case 'integer':
    case 'number':
      return <JSONSchemaStringEditor {...props} />;
    default:
      return <JSONSchemaUnknownEditor {...props} />;
  }
}
