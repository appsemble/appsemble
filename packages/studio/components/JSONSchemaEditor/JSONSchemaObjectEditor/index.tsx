import { Title } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';

import { Collapsible } from '../../Collapsible/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor/index.js';
import { CommonJSONSchemaEditorProps } from '../types.js';
import styles from './index.module.css';

export function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  nested,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<Record<string, string>>): ReactElement {
  const onPropertyChange = useCallback(
    ({ currentTarget }, val) => {
      const id = currentTarget.name.slice(name.length + 1);
      onChange({ currentTarget: { name } }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  const content = Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
    <RecursiveJSONSchemaEditor
      disabled={disabled}
      key={propName}
      name={name ? `${name}.${propName}` : propName}
      nested
      onChange={onPropertyChange}
      prefix={prefix}
      required={
        (Array.isArray(schema.required) && schema.required.includes(propName)) ||
        subSchema.required === true
      }
      schema={subSchema}
      value={value?.[propName]}
    />
  ));

  return (
    <div className={nested ? `${styles.nested} px-3 py-3 my-2 mx-0` : null}>
      {nested ? (
        <Collapsible
          level={5}
          size={3}
          title={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
        >
          {content}
        </Collapsible>
      ) : (
        <>
          <Title level={5} size={3}>
            <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
          </Title>
          {content}
        </>
      )}
    </div>
  );
}
