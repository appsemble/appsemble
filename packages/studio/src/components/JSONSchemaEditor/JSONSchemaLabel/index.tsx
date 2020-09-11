import React, { ReactElement } from 'react';

import type { CommonJSONSchemaEditorProps } from '../types';

export function JSONSchemaLabel({
  name,
  prefix,
  schema,
}: Pick<CommonJSONSchemaEditorProps<never>, 'name' | 'prefix' | 'schema'>): ReactElement {
  return (schema?.title ? (
    <>
      {`${schema.title} `}
      <span className="has-text-weight-normal has-text-grey-light">
        ({name.slice(prefix.length + 1)})
      </span>
    </>
  ) : (
    name.slice(prefix.length + 1)
  )) as ReactElement;
}
