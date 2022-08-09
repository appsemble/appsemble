import equal from 'fast-deep-equal';
import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

import { TextAreaField } from '../index.js';
import { messages } from './messages.js';

interface JSONFieldProps
  extends Omit<ComponentPropsWithoutRef<typeof TextAreaField>, 'onChange' | 'value'> {
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
  value?: any;
}

/**
 * Edit JSON content in a textarea
 *
 * If the user enters invalid JSON, an error help message will be rendered.
 */
export const JSONField = forwardRef<HTMLTextAreaElement, JSONFieldProps>(
  ({ error, onChange, value, ...props }, ref): ReactElement => {
    const [oldValue, setOldValue] = useState(JSON.stringify(value, null, 2));
    const [parseError, setParseError] = useState(false);

    useEffect(() => {
      try {
        if (equal(value, JSON.parse(oldValue))) {
          return;
        }
      } catch {
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
        } catch {
          setParseError(true);
          return;
        }
        setParseError(false);
        onChange(event, val);
      },
      [onChange],
    );

    return (
      <TextAreaField
        {...props}
        error={parseError ? <FormattedMessage {...messages.error} /> : error}
        onChange={handleChange}
        ref={ref}
        value={oldValue}
      />
    );
  },
);
