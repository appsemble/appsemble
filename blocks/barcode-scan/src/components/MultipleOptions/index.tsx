import { type VNode } from 'preact';

import styles from './index.module.css';

interface MultipleOptionsProps {
  array: string[];

  /**
   * The accessible name of the select.
   */
  label: string;
  onChange: any;
  value: string;
}

export function MultipleOptions({ array, label, onChange, value }: MultipleOptionsProps): VNode {
  return (
    <div className={styles.comboBoxContainer}>
      <select aria-label={label} onChange={onChange} value={value}>
        {array.map((element: string) => (
          <option key={element} value={element}>
            {element}
          </option>
        ))}
      </select>
    </div>
  );
}
