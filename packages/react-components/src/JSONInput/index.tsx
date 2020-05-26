import equal from 'fast-deep-equal';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import TextArea from '../Textarea';
import messages from './messages';

interface JSONInputProps extends React.ComponentPropsWithoutRef<typeof TextArea> {
  /**
   * This is called when he input has changed to match a new valid JSON value.
   *
   * @param event The original event.
   * @param value The new value.
   */
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>, value: any) => void;

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
}: JSONInputProps): React.ReactElement {
  const [oldValue, setOldValue] = React.useState(JSON.stringify(value, null, 2));
  const [parseError, setParseError] = React.useState(false);

  React.useEffect(() => {
    try {
      if (equal(value, JSON.parse(oldValue))) {
        return;
      }
    } catch (err) {
      return;
    }
    setOldValue(JSON.stringify(value, null, 2));
  }, [oldValue, value]);

  const handleChange = React.useCallback(
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
