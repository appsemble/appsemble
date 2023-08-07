import { type VNode } from 'preact';

import styles from './index.module.css';

interface MultipleOptionsProps {
  array: string[];
  onChange: any;
  value: string;
}

export function MultipleOptions({ array, onChange, value }: MultipleOptionsProps): VNode {
  return (
    <div className={styles.comboBoxContainer}>
      <select onChange={onChange} value={value}>
        {array.map((element: string) => (
          <option key={element} value={element}>
            {element}
          </option>
        ))}
      </select>
    </div>
  );
}
