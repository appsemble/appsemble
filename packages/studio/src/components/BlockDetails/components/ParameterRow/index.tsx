import { Icon, Join } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import type { Definition } from 'typescript-json-schema';

import MarkdownContent from '../../../MarkdownContent';

interface ParameterRowProps {
  /**
   * The parent of value.
   *
   * This is used to determine whether or not a property is required.
   */
  parent: Definition;

  /**
   * The name of the property to render.
   */
  name: string;

  /**
   * The schema to render.
   */
  value: Definition;

  /**
   * Whether recursion should be applied to further render children properties.
   */
  recurse: boolean;
}

/**
 * Render one or multiple rows for a parameter.
 *
 * Multiple rows are returned if `recurse` is set to true and if the parameter is an object or an
 * array.
 */
export default function ParameterRow({
  name,
  parent,
  recurse,
  value,
}: ParameterRowProps): React.ReactElement {
  const match = useRouteMatch();

  if (value.type === 'array' && recurse) {
    return (
      <>
        <ParameterRow name={`${name}[]`} parent={parent} recurse={false} value={value} />
        {Object.entries(value.items)
          .filter(([childName, child]) => typeof child === 'object' && childName !== 'anyOf')
          .map(([childName, child]) => (
            <ParameterRow
              key={childName}
              name={`${name}[].${childName}`}
              parent={value}
              recurse
              value={child}
            />
          ))}
      </>
    );
  }

  if (value.type === 'object' && recurse) {
    return (
      <>
        <ParameterRow name={name} parent={parent} recurse={false} value={value} />
        {Object.entries(value.properties)
          .filter(([childName, child]) => typeof child === 'object' && childName !== 'anyOf')
          .map(([childName, child]) => (
            <ParameterRow
              key={childName}
              name={`${name}.${childName}`}
              parent={value}
              recurse
              value={child as Definition}
            />
          ))}
      </>
    );
  }

  const { type } = value;
  let ref;

  if ('$ref' in value) {
    const refName = (value as any).$ref?.split('/').pop();
    ref = <a href={`${match.url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).$ref) {
    const refName = (value.items as any).$ref.split('/').pop();
    ref = <a href={`${match.url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).anyOf) {
    ref = (value.items as any).anyOf.map((any: OpenAPIV3.ReferenceObject) => {
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
        {value.anyOf.map((any: OpenAPIV3.ReferenceObject, index) => {
          const refName = any.$ref?.split('/').pop();

          if (!refName) {
            // eslint-disable-next-line react/no-array-index-key
            return <React.Fragment key={index}>{(any as any).type}</React.Fragment>;
          }
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
        {value.format === 'remapper' ? (
          <a href="https://appsemble.dev/guide/remappers" rel="noopener noreferrer" target="_blank">
            Remapper
          </a>
        ) : (
          value.enum?.length && (
            <Join separator=" | ">
              {value.enum.map((e) => (
                <code key={JSON.stringify(e)}>{JSON.stringify(e)}</code>
              ))}
            </Join>
          )
        )}
        {value.type === 'array' && (
          <div>
            {'Array<'}
            <Join separator=" | ">
              {'type' in (value.items as Definition) && (value.items as Definition).type}
              {Object.values(value.items)
                .map(({ type: t }) => t)
                .filter(Boolean)
                .filter((t) => t !== 'object' && t !== 'array')
                .map((t) => (
                  <React.Fragment key={t}>{t}</React.Fragment>
                ))}
              {ref}
            </Join>
            {'>'}
          </div>
        )}
        {ref && value.type !== 'array' && ref}
        {!ref && !value?.enum?.length && type !== 'array' && (
          <Join separator=" | ">
            {[].concat(type).map((t) => (
              <React.Fragment key={t}>{t}</React.Fragment>
            ))}
          </Join>
        )}
      </td>
      <td>
        <MarkdownContent content={value.description} />
      </td>
    </tr>
  );
}
