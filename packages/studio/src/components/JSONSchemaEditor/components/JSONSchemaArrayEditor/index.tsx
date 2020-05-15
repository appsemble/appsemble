import { Button, Title } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import type { NamedEvent } from 'packages/studio/src/types';
import * as React from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import JSONSchemaLabel from '../JSONSchemaLabel';
import RecursiveJSONSchemaEditor from '../RecursiveJSONSchemaEditor';
import styles from './index.css';

const defaults = {
  array: [] as const,
  boolean: false,
  integer: 0,
  object: {},
  null: null as null,
  number: 0,
  string: '',
};

export default function JSONSchemaArrayEditor({
  disabled,
  name,
  prefix,
  onChange,
  schema,
  value = [],
}: CommonJSONSchemaEditorProps<any[], OpenAPIV3.ArraySchemaObject>): React.ReactElement {
  const onPropertyChange = React.useCallback(
    ({ target }: NamedEvent, val) => {
      const index = Number(target.name.slice(name.length + 1));
      onChange(
        { target: { name } },
        value.map((v, i) => (i === index ? val : v)),
      );
    },
    [onChange, name, value],
  );

  const removeItem = React.useCallback(
    ({ currentTarget }: React.MouseEvent<HTMLButtonElement>) => {
      const index = Number(currentTarget.name.slice(name.length + 1));
      onChange(
        { target: { name } },
        value.filter((_val, i) => i !== index),
      );
    },
    [onChange, name, value],
  );

  const onItemAdded = React.useCallback(
    ({ currentTarget }: React.MouseEvent<HTMLButtonElement>) => {
      const addedName = currentTarget.name;
      const index = addedName ? Number(addedName.slice(addedName.length + 1)) + 1 : 0;
      const items = schema.items as OpenAPIV3.SchemaObject;
      onChange({ target: { name } }, [
        ...value.slice(0, index),
        items.default ?? defaults[items.type],
        ...value.slice(index, value.length),
      ]);
    },
    [onChange, name, value, schema],
  );

  return (
    <div className={styles.root}>
      <Button className="is-pulled-right" color="success" icon="plus" onClick={onItemAdded} />
      <Title className={styles.title} level={5}>
        <JSONSchemaLabel name={name} prefix={prefix} schema={schema} />
      </Title>
      {value.map((val, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index}>
          <RecursiveJSONSchemaEditor
            disabled={disabled}
            name={`${name}.${index}`}
            onChange={onPropertyChange}
            prefix={prefix}
            schema={schema.items as OpenAPIV3.ArraySchemaObject}
            value={val}
          />
          <div className="is-pulled-right">
            <Button color="danger" icon="minus" name={`${name}.${index}`} onClick={removeItem} />
            <Button color="success" icon="plus" name={`${name}.${index}`} onClick={onItemAdded} />
          </div>
          <hr />
        </div>
      ))}
    </div>
  );
}
