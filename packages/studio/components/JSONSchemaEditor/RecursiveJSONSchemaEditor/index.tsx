import { type ReactElement } from 'react';

import { JSONSchemaArrayEditor } from '../JSONSchemaArrayEditor/index.js';
import { JSONSchemaBooleanEditor } from '../JSONSchemaBooleanEditor/index.js';
import { JSONSchemaEnumEditor } from '../JSONSchemaEnumEditor/index.js';
import { JSONSchemaNumberEditor } from '../JSONSchemaNumberEditor/index.js';
import { JSONSchemaObjectEditor } from '../JSONSchemaObjectEditor/index.js';
import { JSONSchemaStringEditor } from '../JSONSchemaStringEditor/index.js';
import { JSONSchemaUnknownEditor } from '../JSONSchemaUnknownEditor/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function RecursiveJSONSchemaEditor(props: CommonJSONSchemaEditorProps<any>): ReactElement {
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
    case 'integer':
    case 'number':
      return <JSONSchemaNumberEditor {...props} />;
    case 'string':
      return <JSONSchemaStringEditor {...props} />;
    default:
      return <JSONSchemaUnknownEditor {...props} />;
  }
}
