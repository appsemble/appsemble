import { Icon, Join } from '@appsemble/react-components';
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
    return (
      <ParameterRow
        name={`${name}[]`}
        parameters={parameters}
        parent={parent}
        recurse={false}
        value={value}
      />
    );
  }

  const { type } = value;
  let ref;

  if (Object.hasOwnProperty.call(value, '$ref')) {
    const refName = (value as any).$ref?.split('/').pop();
    ref = <a href={`${match.url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).$ref) {
    const refName = (value.items as any).$ref.split('/').pop();
    ref = <a href={`${match.url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).anyOf) {
    ref = (value.items as any).anyOf.map((any: any) => {
      const refName = any.$ref.split('/').pop();
      return (
        <a key={refName} href={`${match.url}#${refName}`}>
          {refName}
        </a>
      );
    });
  } else if (value.anyOf && value.format !== 'remapper') {
    ref = (
      <Join separator=" | ">
        {value.anyOf.map((any: any) => {
          const refName = any.$ref?.split('/').pop();
          return (
            <a key={refName} href={`${match.url}#${refName}`}>
              {refName}
            </a>
          );
        })}
      </Join>
    );
  }

  return (
    <tr>
      <td>{name}</td>
      <td>
        {parent.required?.some((r) => name.replace(/\[]/g, '').endsWith(r)) && (
          <Icon className="has-text-success" icon="check" />
        )}
      </td>
      <td>
        <span>
          {value.format === 'remapper' ? (
            <a
              href="https://appsemble.dev/guide/remappers"
              rel="noopener noreferrer"
              target="_blank"
            >
              Remapper
            </a>
          ) : (
            value.enum?.length && <Join separator=" | ">{value.enum.map((e) => `“${e}”`)}</Join>
          )}
        </span>
        {ref && value.type === 'array' && (
          <div>
            {'Array<'}
            <Join separator=" | ">{ref}</Join>
            {'>'}
          </div>
        )}
        {ref && value.type !== 'array' && ref}
        {!ref && !value?.enum?.length && type}
      </td>
      <td>{value.description}</td>
    </tr>
  );
}
