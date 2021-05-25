import { Join, MarkdownContent } from '@appsemble/react-components';
import { OpenAPIV3 } from 'openapi-types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages';

interface SchemaProps {
  schema: OpenAPIV3.SchemaObject;
  name?: string;
  nested: boolean;
  required?: boolean;
}

export function Schema({ name, nested, required, schema }: SchemaProps): ReactElement {
  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : ''}>
      {name && (
        <div>
          <span className="has-text-weight-bold">{name}</span>
          {required && (
            <span className="ml-2 tag is-info">
              <FormattedMessage {...messages.required} />
            </span>
          )}
        </div>
      )}
      {nested ? (
        <p>
          <span className="mr-1">
            <FormattedMessage {...messages.type} />:
          </span>
          <code>
            {schema.type === 'array'
              ? `${(schema.items as OpenAPIV3.SchemaObject).type}[]`
              : schema.type}
          </code>
        </p>
      ) : null}
      {schema.description && nested && <MarkdownContent content={schema.description} />}
      {schema.default != null && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.default} />:
          </span>
          {schema.default}
        </p>
      )}
      {schema.enum?.length ? (
        <div>
          <span className="mr-2">
            <FormattedMessage {...messages.options} />:
          </span>
          <Join separator=" | ">
            {schema.enum.map((option) => (
              <code key={option}>{option}</code>
            ))}
          </Join>
        </div>
      ) : null}
      {schema.minItems > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.minItems} />:
          </span>
          {schema.minItems}
        </p>
      )}
      {schema.maxItems > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.maxItems} />:
          </span>
          {schema.maxItems}
        </p>
      )}
      {schema.minLength > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.minLength} />:
          </span>
          {schema.minLength}
        </p>
      )}
      {schema.maxLength > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.maxLength} />:
          </span>
          {schema.maxLength}
        </p>
      )}
      {schema.minimum > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.minimum} />:
          </span>
          {schema.minimum}
        </p>
      )}
      {schema.maximum > 0 && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.maximum} />:
          </span>
          {schema.maximum}
        </p>
      )}
      {schema.pattern && (
        <p>
          <span className="has-text-weight-bold mr-1">
            <FormattedMessage {...messages.pattern} />:
          </span>
          <code>{schema.pattern ?? 'foo'}</code>
        </p>
      )}
      {schema.type === 'object' &&
        Object.entries(schema.properties).map(([propertyName, property]) => (
          <Schema
            key={propertyName}
            name={propertyName}
            nested
            required={schema?.required?.includes(propertyName)}
            schema={property as OpenAPIV3.SchemaObject}
          />
        ))}
      {schema.type === 'array' &&
        Object.entries((schema.items as OpenAPIV3.SchemaObject).properties ?? {}).map(
          ([propertyName, property]) => (
            <Schema
              key={propertyName}
              name={propertyName}
              nested
              required={(schema.items as OpenAPIV3.SchemaObject).required?.includes(propertyName)}
              schema={property as OpenAPIV3.SchemaObject}
            />
          ),
        )}
    </div>
  );
}
