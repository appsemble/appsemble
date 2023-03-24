import { useBlock } from '@appsemble/preact';
import { Input, TextArea, useDebounce } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { StringField } from '../../../block.js';

interface StringFieldProps {
  field: StringField;
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

export function StringInput({ field, index, item, repeatedIndex }: StringFieldProps): VNode {
  const {
    actions,
    utils: { remap },
  } = useBlock();
  const initialRender = useRef(true);
  const { multiline, name, onEdit, placeholder } = field.string;
  const [value, setValue] = useState(remap(field.value, item, { index, repeatedIndex }) as string);
  const debouncedValue = useDebounce(value);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    const onEditAction = actions[onEdit];

    onEditAction(typeof item === 'object' ? { ...item, [name]: debouncedValue } : debouncedValue, {
      index,
      repeatedIndex,
    });
  }, [actions, debouncedValue, item, index, name, onEdit, repeatedIndex]);

  const onChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value: fieldValue } = event.currentTarget;
      setValue(fieldValue);
    },
    [],
  );

  return multiline ? (
    <TextArea
      onChange={onChange}
      placeholder={remap(placeholder, item, { index, repeatedIndex }) as string}
      value={value}
    />
  ) : (
    <Input
      onChange={onChange}
      placeholder={remap(placeholder, item, { index, repeatedIndex }) as string}
      value={value}
    />
  );
}
