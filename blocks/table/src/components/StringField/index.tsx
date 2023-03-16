import { useBlock } from '@appsemble/preact';
import { Input, TextArea, useDebounce } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

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
  const initialItemRef = useRef(item);
  const { multiline, name, onEdit } = field.string;
  const [value, setValue] = useState(remap(field.value, item, { index, repeatedIndex }) as string);
  const debouncedValue = useDebounce(value);

  useEffect(() => {
    const onEditAction = actions[onEdit];
    const initialItem = initialItemRef.current;

    if (['string', 'boolean', 'number', 'bigint'].includes(typeof initialItem)) {
      onEditAction(debouncedValue, { index, repeatedIndex });
    } else if (typeof initialItem === 'object') {
      onEditAction({ ...initialItem, [name]: debouncedValue }, { index, repeatedIndex });
    }
  }, [actions, debouncedValue, index, name, onEdit, repeatedIndex]);

  const onChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(event.currentTarget.value);
    },
    [],
  );

  return multiline ? (
    <TextArea onChange={onChange} value={value} />
  ) : (
    <Input onChange={onChange} value={value} />
  );
}
