import { ReactElement } from 'react';

import { JSONSchemaArrayEditor } from '../JSONSchemaArrayEditor';
import { JSONSchemaBooleanEditor } from '../JSONSchemaBooleanEditor';
import { JSONSchemaEnumEditor } from '../JSONSchemaEnumEditor';
import { JSONSchemaNumberEditor } from '../JSONSchemaNumberEditor';
import { JSONSchemaObjectEditor } from '../JSONSchemaObjectEditor';
import { JSONSchemaStringEditor } from '../JSONSchemaStringEditor';
import { JSONSchemaUnknownEditor } from '../JSONSchemaUnknownEditor';
import { CommonJSONSchemaEditorProps } from '../types';

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
