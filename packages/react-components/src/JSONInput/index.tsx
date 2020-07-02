import equal from 'fast-deep-equal';
import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import TextArea from '../Textarea';
import messages from './messages';

interface JSONInputProps extends ComponentPropsWithoutRef<typeof TextArea> {
  /**
   * This is called when he input has changed to match a new valid JSON value.
   *
   * @param event The original event.
   * @param value The new value.
   */
  onChange: (event: ChangeEvent<HTMLTextAreaElement>, value: any) => void;

  /**
   * The current value to render.
   *
   * If this changes and doesn’t match the old value, a stringified value of this rendered.
   */
  value: any;
}

/**
 * Edit JSON content in a textarea
 *
 * If the user enters invalid JSON, an error help message will be rendered.
 */
export default function JSONInput({
  error,
  onChange,
  value,
  ...props
}: JSONInputProps): ReactElement {
  const [oldValue, setOldValue] = useState(JSON.stringify(value, null, 2));
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      if (equal(value, JSON.parse(oldValue))) {
        return;
      }
    } catch (err) {
      return;
    }
    setOldValue(JSON.stringify(value, null, 2));
  }, [oldValue, value]);

  const handleChange = useCallback(
    (event, v) => {
      let val: any;
      setOldValue(val);
      try {
        val = v === '' ? null : JSON.parse(v);
      } catch (err) {
        setParseError(true);
        return;
      }
      setParseError(false);
      onChange(event, val);
    },
    [onChange],
  );

  return (
    <TextArea
      error={parseError ? <FormattedMessage {...messages.error} /> : error}
      onChange={handleChange}
      value={oldValue}
      {...props}
    />
  );
}
