import * as React from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';

export default function JSONSchemaLabel({
  name,
  prefix,
  schema,
}: Pick<CommonJSONSchemaEditorProps<never>, 'name' | 'prefix' | 'schema'>): React.ReactElement {
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
