import { Title } from '@appsemble/react-components/src';
import type { OpenAPIV3 } from 'openapi-types';
import React, { ReactElement, useCallback } from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import { JSONSchemaLabel } from '../JSONSchemaLabel';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor';
import styles from './index.css';

export function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  nested,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<{ [key: string]: string }>): ReactElement {
  const onPropertyChange = useCallback(
    ({ currentTarget }, val) => {
      const id = currentTarget.name.slice(name.length + 1);
      onChange({ currentTarget: { name } }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : null}>
      <Title level={5}>
        <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
      </Title>
      {Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
        <RecursiveJSONSchemaEditor
          disabled={disabled}
          key={propName}
          name={name ? `${name}.${propName}` : propName}
          onChange={onPropertyChange}
          prefix={prefix}
          required={schema.required?.includes(propName)}
          schema={subSchema as OpenAPIV3.SchemaObject}
          value={value?.[propName]}
        />
      ))}
    </div>
  );
}
