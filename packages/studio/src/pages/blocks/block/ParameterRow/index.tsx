import { Icon, Join, MarkdownContent } from '@appsemble/react-components';
import { Schema } from 'jsonschema';
import { OpenAPIV3 } from 'openapi-types';
import { Fragment, ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

interface ParameterRowProps {
  /**
   * The parent of value.
   *
   * This is used to determine whether or not a property is required.
   */
  parent: Schema;

  /**
   * The name of the property to render.
   */
  name: string;

  /**
   * Whether or not this property is required
   */
  required: boolean;

  /**
   * The schema to render.
   */
  value: Schema;

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
export function ParameterRow({
  name,
  parent,
  recurse,
  required,
  value,
}: ParameterRowProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();

  if (value.type === 'array' && recurse) {
    return (
      <>
        <ParameterRow
          name={`${name}[]`}
          parent={parent}
          recurse={false}
          required={required}
          value={value}
        />
        {Object.entries(value.items)
          .filter(([childName, child]) => typeof child === 'object' && childName !== 'anyOf')
          .map(([childName, child]) => (
            <ParameterRow
              key={childName}
              name={`${name}[].${childName}`}
              parent={value}
              recurse
              required={required}
              value={child}
            />
          ))}
      </>
    );
  }

  if (value.type === 'object' && recurse) {
    return (
      <>
        <ParameterRow
          name={name}
          parent={parent}
          recurse={false}
          required={required}
          value={value}
        />
        {Object.entries(value.properties)
          .filter(([childName, child]) => typeof child === 'object' && childName !== 'anyOf')
          .map(([childName, child]) => (
            <ParameterRow
              key={childName}
              name={`${name}.${childName}`}
              parent={value}
              recurse
              required={required}
              value={child}
            />
          ))}
      </>
    );
  }

  const { type } = value;
  let ref;

  if ('$ref' in value) {
    const refName = (value as any).$ref?.split('/').pop();
    ref = <a href={`#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).$ref) {
    const refName = (value.items as any).$ref.split('/').pop();
    ref = <a href={`#${refName}`}>{refName}</a>;
  } else if (value.type === 'array' && (value.items as any).anyOf) {
    ref = (value.items as any).anyOf.map((any: OpenAPIV3.ReferenceObject) => {
      const refName = any.$ref.split('/').pop();
      return (
        <a href={`#${refName}`} key={refName}>
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
            <a href={`#${refName}`} key={refName}>
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
      <td>{required && <Icon className="has-text-success" icon="check" />}</td>
      <td>
        {value.format === 'remapper' ? (
          <Link rel="noopener noreferrer" target="_blank" to={`/${lang}/docs/guide/remappers`}>
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
              {'type' in value.items && value.items?.type}
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
