import { type ReactElement } from 'react';

import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaLabel({
  name,
  prefix,
  schema,
}: Pick<CommonJSONSchemaEditorProps<never>, 'name' | 'prefix' | 'schema'>): ReactElement {
  const displayName = name.slice(prefix.length + 1);

  return (
    schema?.title ? (
      <>
        {`${schema.title} `}
        {displayName ? (
          <span className="has-text-weight-normal has-text-grey-light">({displayName})</span>
        ) : null}
      </>
    ) : (
      displayName
    )
  ) as ReactElement;
}
