import { Select } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Schema, SchemaProps } from '../index.js';
import { messages } from './messages.js';

interface AnyOfSchemaProps extends SchemaProps {
  /**
   * Whether this component is rendering the anyOf property or the oneOf property.
   */
  type: 'anyOf' | 'oneOf';
}

export function AnyOfSchema({ schema, type, ...props }: AnyOfSchemaProps): ReactElement {
  const { formatMessage } = useIntl();
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(0);

  const onChange = useCallback((event: ChangeEvent<HTMLSelectElement>, value: string) => {
    setSelectedSchemaIndex(Number(value));
  }, []);

  const subSchemas = schema[type];

  if (subSchemas.length === 1) {
    // If there is only one option, display the Schema as-is.
    return <Schema {...props} schema={subSchemas[0]} />;
  }

  return (
    <div>
      <div>
        <FormattedMessage {...messages[type]} />
      </div>
      <Select onChange={onChange}>
        {subSchemas.map((subSchema, index) => {
          let value = `${formatMessage(messages.option)} ${index + 1}`;

          if (subSchema.$ref) {
            value = subSchema.$ref.split('/').pop();
          } else if (
            subSchema?.type !== 'object' &&
            subSchema?.type !== 'array' &&
            !Array.isArray(subSchema?.type)
          ) {
            value = subSchema.type;
          }

          return (
            // eslint-disable-next-line react/no-array-index-key
            <option key={index} value={index}>
              {value}
            </option>
          );
        })}
      </Select>
      <Schema {...props} schema={subSchemas[selectedSchemaIndex]} />
    </div>
  );
}
