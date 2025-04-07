import { generateDataFromSchema } from '@appsemble/lang-sdk';
import { Button, CardFooterButton, ModalCard } from '@appsemble/react-components';
import { type NamedEvent } from '@appsemble/web-utils';
import { type OpenAPIV3 } from 'openapi-types';
import { type MouseEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { Collapsible } from '../../Collapsible/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { RecursiveJSONSchemaEditor } from '../RecursiveJSONSchemaEditor/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaArrayEditor({
  disabled,
  name,
  onChange,
  prefix,
  schema,
  value = [],
}: CommonJSONSchemaEditorProps<any[]>): ReactNode {
  const { formatMessage } = useIntl();
  const items = (schema as OpenAPIV3.ArraySchemaObject).items as OpenAPIV3.SchemaObject;
  const [removingItem, setRemovingItem] = useState<number>();

  const onPropertyChange = useCallback(
    ({ currentTarget }: NamedEvent, val: string) => {
      const index = Number(currentTarget.name.slice(name.length + 1));
      onChange(
        { currentTarget: { name } },
        value.map((v, i) => (i === index ? val : v)),
      );
    },
    [onChange, name, value],
  );

  const removeItem = useCallback(() => {
    onChange(
      { currentTarget: { name } },
      value.filter((val, i) => i !== removingItem),
    );
    setRemovingItem(null);
  }, [name, onChange, removingItem, value]);

  const onClickRemoveItem = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      const index = Number(currentTarget.name.slice(name.length + 1));
      setRemovingItem(index);
    },
    [name.length],
  );

  const onCancelRemoveItem = useCallback(() => {
    setRemovingItem(null);
  }, []);

  const onItemAdded = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      const addedName = currentTarget.name;
      const index = addedName ? Number(addedName.split('.').pop()) + 1 : 0;
      onChange({ currentTarget: { name } }, [
        ...value.slice(0, index),
        generateDataFromSchema(items),
        ...value.slice(index, value.length),
      ]);
    },
    [items, onChange, name, value],
  );

  const onItemSwapped = useCallback(
    ({ currentTarget }: MouseEvent<HTMLButtonElement>) => {
      const copy = [...value];
      const [i] = currentTarget.name.replace(`${name}.`, '').split('.');
      const index = Number(i);
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];

      onChange({ currentTarget: { name } }, copy);
    },
    [name, onChange, value],
  );

  return (
    <div className={`${styles.root} px-3 py-3 my-2 mx-0`}>
      {schema.maxItems == null || value.length < schema.maxItems ? (
        <Button
          className="is-pulled-right"
          color="success"
          icon="plus"
          onClick={onItemAdded}
          title={formatMessage(messages.addTop, { name: name.replace(`${prefix}.`, '') })}
        />
      ) : null}
      <Collapsible
        className={styles.title}
        level={5}
        size={3}
        title={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      >
        {value.map((val, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div className="my-1" key={index}>
            <RecursiveJSONSchemaEditor
              disabled={disabled}
              name={`${name}.${index}`}
              nested
              onChange={onPropertyChange}
              prefix={prefix}
              required={schema.minItems != null && index < schema.minItems}
              schema={items}
              value={val}
            />
            <div className="is-pulled-right">
              {value.length && index !== value.length - 1 ? (
                <Button
                  className="mr-1"
                  color="info"
                  icon="arrows-alt-v"
                  name={`${name}.${index}`}
                  onClick={onItemSwapped}
                  title={formatMessage(messages.swap)}
                />
              ) : null}
              {schema.minItems == null || value.length > schema.minItems ? (
                <Button
                  color="danger"
                  icon="minus"
                  name={`${name}.${index}`}
                  onClick={onClickRemoveItem}
                  title={formatMessage(messages.removeAbove, {
                    name: `${name.replace(`${prefix}.`, '')}.${index}`,
                  })}
                />
              ) : null}
              {schema.maxItems == null || value.length < schema.maxItems ? (
                <Button
                  className="ml-1"
                  color="success"
                  icon="plus"
                  name={`${name}.${index}`}
                  onClick={onItemAdded}
                  title={formatMessage(messages.addBelow, { index: index + 1 })}
                />
              ) : null}
            </div>
            <hr />
          </div>
        ))}
      </Collapsible>
      <ModalCard
        footer={
          <>
            <CardFooterButton onClick={onCancelRemoveItem}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="danger" onClick={removeItem}>
              <FormattedMessage {...messages.confirm} />
            </CardFooterButton>
          </>
        }
        isActive={removingItem != null}
        onClose={onCancelRemoveItem}
        title={<FormattedMessage {...messages.title} />}
      >
        <FormattedMessage {...messages.body} />
      </ModalCard>
    </div>
  );
}
