import { Icon, Join, MarkdownContent } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React, { Fragment, ReactElement } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import type { Definition } from 'typescript-json-schema';

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
export function ParameterRow({ name, parent, recurse, value }: ParameterRowProps): ReactElement {
  const { url } = useRouteMatch();

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
    ref = <a href={`${url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).$ref) {
    const refName = (value.items as any).$ref.split('/').pop();
    ref = <a href={`${url}#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).anyOf) {
    ref = (value.items as any).anyOf.map((any: OpenAPIV3.ReferenceObject) => {
      const refName = any.$ref.split('/').pop();
      return (
        <a href={`${url}#${refName}`} key={refName}>
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
            return <Fragment key={index}>{(any as any).type}</Fragment>;
          }
          return (
            <a href={`${url}#${refName}`} key={refName}>
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
          <Link rel="noopener noreferrer" target="_blank" to="/docs/guide/remappers">
            Remapper
          </Link>
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
                  <Fragment key={t}>{t}</Fragment>
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
              <Fragment key={t}>{t}</Fragment>
            ))}
          </Join>
        )}
      </td>
      <td>
        {value.default !== undefined && (
          <code>
            {typeof value.default === 'string' ? value.default : JSON.stringify(value.default)}
          </code>
        )}
      </td>
      <td>
        <MarkdownContent content={value.description} />
      </td>
    </tr>
  );
}
