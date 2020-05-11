import { Title } from '@appsemble/react-components/src';
import type { OpenAPIV3 } from 'openapi-types';
import type { NamedEvent } from 'packages/studio/src/types';
import * as React from 'react';

import JSONSchemaLabel from '../JSONSchemaLabel';
import RecursiveJSONSchemaEditor from '../RecursiveJSONSchemaEditor';
import styles from './index.css';

interface JSONSchemaObjectEditorProps {
  /**
   * Whether or not the editor is disabled.
   *
   * This value is recursively passed down to all child inputs.
   */
  disabled?: boolean;

  /**
   * The name of the property thas is being rendered.
   *
   * The name is determined by the parent schema. It is used for recursion.
   */
  name?: string;

  /**
   * Whether or not this is a nested component.
   */
  nested?: boolean;

  /**
   * The handler that is called whenever a value changes.
   */
  onChange: (event: NamedEvent, value?: { [key: string]: any }) => void;

  /**
   * The prefix to remove from labels.
   */
  prefix: string;

  /**
   * The schema used to render the form elements.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The value used to populate the editor.
   */
  value: { [key: string]: any };
}

export default function JSONSchemaObjectEditor({
  disabled,
  name,
  onChange,
  nested,
  prefix,
  schema,
  value = {},
}: JSONSchemaObjectEditorProps): React.ReactElement {
  const onPropertyChange = React.useCallback(
    ({ target }, val) => {
      const id = target.name.slice(name.length + 1);
      onChange({ target: { name } }, { ...value, [id]: val });
    },
    [name, onChange, value],
  );

  return (
    <div className={nested ? styles.nested : null}>
      <Title level={5}>
        <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
      </Title>
      {Object.entries(schema?.properties ?? {}).map(([propName, subSchema]) => (
        <RecursiveJSONSchemaEditor
          key={propName}
          disabled={disabled}
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
