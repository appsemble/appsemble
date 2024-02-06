import { Title } from '@appsemble/react-components';
import { type NamedEvent } from '@appsemble/web-utils';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { Collapsible } from '../../Collapsible/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaObjectEditor({
  disabled,
  name,
  nested,
  onChange,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<Record<string, string>>): ReactNode {
  const onPropertyChange = useCallback(
    ({ currentTarget }: NamedEvent, val: string) => {
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
