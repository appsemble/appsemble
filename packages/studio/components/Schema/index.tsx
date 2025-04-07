import { camelToHyphen, combineSchemas, decodeJSONRef } from '@appsemble/lang-sdk';
import { Join, Title } from '@appsemble/react-components';
import classNames from 'classnames';
import { type Schema as SchemaType } from 'jsonschema';
import { type FC, type ReactNode, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { AnyOfSchema } from './AnyOfSchema/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { SchemaDescriptor } from './SchemaDescriptor/index.js';
import { MarkdownContent } from '../MarkdownContent/index.js';

export interface RenderRefProps {
  isArray: boolean;
  jsonRef: string;
}

export interface SchemaProps {
  /**
   * If this is true, anchors will be rendered for all properties.
   */
  readonly anchors?: boolean;

  /**
   * If specified, use this prefix for the generated title ID.
   */
  readonly idPrefix?: string;

  /**
   * The JSON schema to render
   */
  readonly schema: SchemaType;

  /**
   * The name of the property to render for nested a nested schema.
   */
  readonly name?: string;

  /**
   * Whether or not the schema is nested.
   */
  readonly nested?: boolean;

  /**
   * A component used to render found JSON references.
   */
  readonly renderRef?: FC<RenderRefProps>;

  /**
   * Whether or not the schema is required by its parent schema.
   */
  readonly required?: boolean;
}

/**
 * Render a JSON schema into readable API documentation.
 */
export function Schema({
  anchors,
  idPrefix,
  name,
  nested,
  renderRef: RenderRef = null,
  required,
  schema,
}: SchemaProps): ReactNode {
  const mergedSchema = useMemo(
    () => (schema.allOf ? combineSchemas(...schema.allOf) : schema),
    [schema],
  );

  const intl = useIntl();

  const { lang } = useParams<{ lang: string }>();
  const description =
    mergedSchema.description ||
    (mergedSchema.items && !Array.isArray(mergedSchema.items) && mergedSchema.items.description);

  let id = idPrefix;
  if (name) {
    id = camelToHyphen(name);
    if (idPrefix) {
      id = `${idPrefix}-${id}`;
    }
  }

  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : ''}>
      {name ? (
        <div className={classNames('pb-2', { [styles.hasAnchor]: anchors })}>
          <Title anchor={anchors} className="is-inline-block is-marginless" id={id} size={5}>
            {mergedSchema.title ? (
              <>
                <span className="mr-1">{mergedSchema.title}</span>
                <span className="has-text-weight-normal has-text-grey-light">({name})</span>
              </>
            ) : (
              name
            )}
          </Title>
          {required || mergedSchema.required === true ? (
            <span className="ml-2 tag is-info">
              <FormattedMessage {...messages.required} />
            </span>
          ) : null}
        </div>
      ) : null}
      {nested ? (
        mergedSchema.$ref || mergedSchema.type ? (
          <SchemaDescriptor label={<FormattedMessage {...messages.type} />}>
            <code>
              {mergedSchema.$ref
                ? RenderRef && (
                    <RenderRef isArray={false} jsonRef={decodeJSONRef(mergedSchema.$ref)} />
                  )
                : mergedSchema.type === 'array'
                  ? !mergedSchema.items || Array.isArray(mergedSchema.items)
                    ? 'array'
                    : mergedSchema.items.type
                      ? `${mergedSchema.items.type}[]`
                      : mergedSchema.items.$ref
                        ? RenderRef && (
                            <RenderRef isArray jsonRef={decodeJSONRef(mergedSchema.items.$ref)} />
                          )
                        : 'array'
                  : mergedSchema.type}
            </code>
          </SchemaDescriptor>
        ) : null
      ) : null}
      {mergedSchema.default != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.default} />}>
          <code>{JSON.stringify(mergedSchema.default)}</code>
        </SchemaDescriptor>
      )}
      {mergedSchema.enum?.length ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.options} />}>
          <Join separator=" | ">
            {mergedSchema.enum.map((option) => (
              <code key={option}>{JSON.stringify(option)}</code>
            ))}
          </Join>
        </SchemaDescriptor>
      ) : null}
      {mergedSchema.format ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.format} />}>
          {mergedSchema.format === 'remapper' ? (
            <Link rel="noopener noreferrer" target="_blank" to={`/${lang}/docs/remappers`}>
              Remapper
            </Link>
          ) : (
            mergedSchema.format
          )}
        </SchemaDescriptor>
      ) : null}
      {mergedSchema.minItems > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minItems} />}>
          {mergedSchema.minItems}
        </SchemaDescriptor>
      )}
      {mergedSchema.maxItems != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxItems} />}>
          {mergedSchema.maxItems}
        </SchemaDescriptor>
      )}
      {mergedSchema.minLength > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minLength} />}>
          {mergedSchema.minLength}
        </SchemaDescriptor>
      )}
      {mergedSchema.maxLength != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maxLength} />}>
          {mergedSchema.maxLength}
        </SchemaDescriptor>
      )}
      {mergedSchema.minimum > 0 && (
        <SchemaDescriptor label={<FormattedMessage {...messages.minimum} />}>
          {mergedSchema.minimum}
        </SchemaDescriptor>
      )}
      {mergedSchema.maximum != null && (
        <SchemaDescriptor label={<FormattedMessage {...messages.maximum} />}>
          {mergedSchema.maximum}
        </SchemaDescriptor>
      )}
      {mergedSchema.pattern ? (
        <SchemaDescriptor label={<FormattedMessage {...messages.pattern} />}>
          <code>{mergedSchema.pattern as string}</code>
        </SchemaDescriptor>
      ) : null}
      {description ? <MarkdownContent content={description} /> : null}
      {mergedSchema.type === 'object' && (
        <>
          {mergedSchema.additionalProperties === true ? (
            <p>
              <FormattedMessage {...messages.additionalPropertiesAllowed} />
            </p>
          ) : null}
          {typeof mergedSchema.additionalProperties === 'object' ? (
            <Schema
              anchors={anchors}
              idPrefix={id}
              name={intl.formatMessage(messages.additionalProperties)}
              nested
              renderRef={RenderRef}
              schema={mergedSchema.additionalProperties}
            />
          ) : null}
          {mergedSchema.properties
            ? Object.entries(mergedSchema.properties).map(([propertyName, property]) => (
                <Schema
                  anchors={anchors}
                  idPrefix={id}
                  key={propertyName}
                  name={propertyName}
                  nested
                  renderRef={RenderRef}
                  required={
                    Array.isArray(mergedSchema.required) &&
                    mergedSchema.required?.includes(propertyName)
                  }
                  schema={property}
                />
              ))
            : null}
        </>
      )}
      {mergedSchema.anyOf?.length ? (
        <AnyOfSchema
          anchors={anchors}
          idPrefix={id}
          nested
          renderRef={RenderRef}
          schema={mergedSchema}
          type="anyOf"
        />
      ) : null}
      {mergedSchema.oneOf?.length ? (
        <AnyOfSchema
          anchors={anchors}
          idPrefix={id}
          nested
          renderRef={RenderRef}
          schema={mergedSchema}
          type="oneOf"
        />
      ) : null}
      {mergedSchema.type === 'array' && mergedSchema.items && !Array.isArray(mergedSchema.items)
        ? Object.entries(mergedSchema.items.properties ?? {}).map(([propertyName, property]) => (
            <Schema
              anchors={anchors}
              idPrefix={id}
              key={propertyName}
              name={propertyName}
              nested
              renderRef={RenderRef}
              required={
                typeof (schema.items as SchemaType).required === 'object' &&
                ((schema.items as SchemaType).required as string[]).includes(propertyName)
              }
              schema={property}
            />
          ))
        : null}
    </div>
  );
}
