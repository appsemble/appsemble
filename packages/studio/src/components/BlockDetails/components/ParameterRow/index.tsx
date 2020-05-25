import { Icon } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';

import type { ExtendedParameters } from '../..';

export default function ParameterRow({
  name,
  parameters,
  parent,
  recurse,
  value,
}: {
  parameters: ExtendedParameters;
  parent: OpenAPIV3.SchemaObject;
  name: string;
  value: OpenAPIV3.SchemaObject;
  recurse: boolean;
}): React.ReactElement {
  const match = useRouteMatch();
  if (value.type === 'array' && recurse) {
    if ((value.items as OpenAPIV3.SchemaObject).anyOf) {
      console.log('anyof');
    }

    return (
      <>
        <ParameterRow
          name={`${name}[]`}
          parameters={parameters}
          parent={parent}
          recurse={false}
          value={value}
        />
        <ParameterRow
          name={`${name}[]`}
          parameters={parameters}
          parent={parent}
          recurse={false}
          value={value}
        />
      </>
    );
  }

  const { type } = value;
  const ref = Object.hasOwnProperty.call(value, '$ref') && (value as any).$ref?.split('/').pop();

  return (
    <tr>
      <td>{name}</td>
      <td>
        {parent.required?.includes(name) && <Icon className="has-text-success" icon="check" />}
      </td>
      <td>
        {type}
        {ref && <a href={`${match.url}#${ref}`}>{ref}</a>}
      </td>
      <td>{value.description}</td>
    </tr>
  );
}
