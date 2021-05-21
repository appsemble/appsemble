import { OpenAPIV3 } from 'openapi-types';
import { ReactElement } from 'react';
import { Join } from 'react-components/src/Join';
import { MarkdownContent } from 'react-components/src/MarkdownContent';
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
          {required ? (
            <span className="ml-2 tag is-info">
              <FormattedMessage {...messages.required} />
            </span>
          ) : null}
        </div>
      )}
      {nested ? (
        <p>
          <FormattedMessage {...messages.type} />: <code>{schema.type}</code>
        </p>
      ) : null}
      {schema.description && nested && <MarkdownContent content={schema.description} />}
      {schema.default == null ? null : (
        <p>
          <FormattedMessage {...messages.default} />: {schema.default}
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
      {schema.type === 'object'
        ? Object.entries(schema.properties).map(([propertyName, property]) => (
            <Schema
              key={propertyName}
              name={propertyName}
              nested
              required={schema?.required?.includes(propertyName)}
              schema={property as OpenAPIV3.SchemaObject}
            />
          ))
        : null}
    </div>
  );
}
