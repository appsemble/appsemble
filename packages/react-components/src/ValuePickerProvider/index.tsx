import * as React from 'react';

interface ValuePickerContext<T> {
  /**
   * The name of the field.
   */
  name?: string;

  /**
   * The change handler for if a value changes.
   */
  onChange: (event: React.SyntheticEvent, value: T) => void;

  /**
   * The current value.
   */
  value: T;
}

const Context = React.createContext<ValuePickerContext<unknown>>(null);

export interface ValuePickerProviderProps<T> extends ValuePickerContext<T> {
  children: React.ReactNode;
}

/**
 * A provider for the value picker context.
 *
 * This allows to create customized components that work similar to HTML select boxes, such as radio
 * groups.
 */
export default function ValuePickerProvider<T>({
  children,
  name,
  onChange,
  value,
}: ValuePickerProviderProps<T>): React.ReactElement {
  const context = React.useMemo(() => ({ name, onChange, value }), [name, onChange, value]);

  return <Context.Provider value={context}>{children}</Context.Provider>;
}

/**
 * Get the value of the value picker context
 */
export function useValuePickerProvider<T>(): ValuePickerContext<T> {
  return React.useContext(Context) as ValuePickerContext<T>;
}
