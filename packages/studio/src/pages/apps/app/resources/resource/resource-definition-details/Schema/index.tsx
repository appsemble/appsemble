import { Join, MarkdownContent } from '@appsemble/react-components';
import { Schema as SchemaType } from 'jsonschema';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { SchemaDescriptor } from '../SchemaDescriptor';
import styles from './index.module.css';
import { messages } from './messages';

interface SchemaProps {
  schema: SchemaType;
  name?: string;
  nested: boolean;
  required?: boolean;
}

export function Schema({ name, nested, required, schema }: SchemaProps): ReactElement {
  const description =
    nested && (schema.description || (!Array.isArray(schema.items) && schema.items.description));
  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : ''}>
      {name && (
        <div>
          <span className="has-text-weight-bold">
            {schema.title ? (
              <>
                <span className="mr-1">{schema.title}</span>
                <span className="has-text-weight-normal has-text-grey-light">({name})</span>
              </>
            ) : (
              name
            )}
          </span>
          {(required || schema.required === true) && (
            <span className="ml-2 tag is-info">
              <FormattedMessage {...messages.required} />
            </span>
          )}
        </div>
      )}
      {nested ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.type} />}>
          <code>
            {schema.type === 'array' && !Array.isArray(schema.items) && schema.items?.type
              ? `${schema.items.type}[]`
              : 'array'}
          </code>
        </SchemaDescriptor>
      ) : null}
      {schema.default != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.default} />}>
          {schema.default}
        </SchemaDescriptor>
      )}
      {schema.enum?.length ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.options} />}>
          <Join separator=" | ">
            {schema.enum.map((option) => (
              <code key={option}>{JSON.stringify(option)}</code>
            ))}
          </Join>
        </SchemaDescriptor>
      ) : null}
      {schema.minItems > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minItems} />}>
          {schema.minItems}
        </SchemaDescriptor>
      )}
      {schema.maxItems > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxItems} />}>
          {schema.maxItems}
        </SchemaDescriptor>
      )}
      {schema.minLength > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minLength} />}>
          {schema.minLength}
        </SchemaDescriptor>
      )}
      {schema.maxLength > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxLength} />}>
          {schema.maxLength}
        </SchemaDescriptor>
      )}
      {schema.minimum > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minimum} />}>
          {schema.minimum}
        </SchemaDescriptor>
      )}
      {schema.maximum > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maximum} />}>
          {schema.maximum}
        </SchemaDescriptor>
      )}
      {schema.pattern && (
        <SchemaDescriptor label={<FormattedMessage {...messages.pattern} />}>
          <code>{schema.pattern ?? 'foo'}</code>
        </SchemaDescriptor>
      )}
      {nested && description && <MarkdownContent content={description} />}
      {schema.type === 'object' &&
        Object.entries(schema.properties).map(([propertyName, property]) => (
          <Schema
            key={propertyName}
            name={propertyName}
            nested
            required={
              typeof schema.required === 'object' && schema.required?.includes(propertyName)
            }
            schema={property}
          />
        ))}
      {schema.type === 'array' &&
        schema.items &&
        !Array.isArray(schema.items) &&
        Object.entries((schema.items as SchemaType).properties ?? {}).map(
          ([propertyName, property]) => (
            <Schema
              key={propertyName}
              name={propertyName}
              nested
              required={
                typeof (schema.items as SchemaType).required === 'object' &&
                ((schema.items as SchemaType).required as string[]).includes(propertyName)
              }
              schema={property as SchemaType}
            />
          ),
        )}
    </div>
  );
}
