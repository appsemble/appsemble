import { useBlock } from '@appsemble/preact';
import { Input, TextArea, useDebounce } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { String as StringFieldType } from '../../../block.js';

interface StringFieldProps {
  field: StringFieldType;
  /**
   * The data to display.
   */
  item: unknown;

  /**
   * The index of the row that was clicked.
   */
  index: number;

  /**
   * The index of the sub row that was clicked.
   */
  repeatedIndex: number;
}

export function StringField({ field, index, item, repeatedIndex }: StringFieldProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();
  const { multiline, name, onEdit } = field.string;
  const [lastChanges, setLastChanges] = useState('');
  const [value, setValue] = useState(remap(field.value, item, { index, repeatedIndex }) as string);
  const debouncedValue = useDebounce(value);

  useEffect(() => {
    setLastChanges(name + debouncedValue);
  }, [debouncedValue, name]);

  useEffect(() => {
    if (!lastChanges) {
      return;
    }

    const onEditAction = actions[onEdit];

    onEditAction(typeof item === 'object' ? { ...item, [name]: debouncedValue } : debouncedValue, {
      index,
      repeatedIndex,
    }).then(() => setLastChanges(''));
  }, [actions, debouncedValue, item, index, name, onEdit, repeatedIndex, lastChanges]);

  const onChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value: fieldValue } = event.currentTarget;
      setValue(fieldValue);
    },
    [],
  );

  return multiline ? (
    <TextArea onChange={onChange} value={value} />
  ) : (
    <Input onChange={onChange} value={value} />
  );
}
