import React, { ReactElement } from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaArrayEditor from '../JSONSchemaArrayEditor';
import JSONSchemaBooleanEditor from '../JSONSchemaBooleanEditor';
import JSONSchemaEnumEditor from '../JSONSchemaEnumEditor';
import JSONSchemaObjectEditor from '../JSONSchemaObjectEditor';
import JSONSchemaStringEditor from '../JSONSchemaStringEditor';
import JSONSchemaUnknownEditor from '../JSONSchemaUnknownEditor';

export default function RecursiveJSONSchemaEditor(
  props: CommonJSONSchemaEditorProps<any>,
): ReactElement {
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
