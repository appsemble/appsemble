import { Title } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { Collapsible } from '../../Collapsible/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor/index.js';
import { type CommonJSONSchemaEditorProps, type JSONSchemaEditorEvent } from '../types.js';

export function JSONSchemaObjectEditor({
  disabled,
  error,
  errors,
  name,
  nested,
  onChange,
  path,
  prefix,
  schema,
  value = {},
}: CommonJSONSchemaEditorProps<Record<string, string>>): ReactNode {
  const onPropertyChange = useCallback(
    ({ currentTarget, path: changedPath }: JSONSchemaEditorEvent, val: string) => {
      const id = currentTarget.name.slice(name.length + 1);
      onChange({ currentTarget: { name }, path: changedPath }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  const content = Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => {
    const required =
      (Array.isArray(schema.required) && schema.required.includes(propName)) ||
      subSchema.required === true;
    return (
      <RecursiveJSONSchemaEditor
        disabled={disabled}
        errors={errors}
        key={propName}
        name={name ? `${name}.${propName}` : propName}
        nested
        onChange={onPropertyChange}
        path={[...path, propName]}
        prefix={prefix}
        required={required}
        schema={subSchema}
        value={value?.[propName]}
      />
    );
  });

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
      {error ? <div className="help is-danger">{error}</div> : null}
    </div>
  );
}
