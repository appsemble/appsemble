import { IconButton } from '@appsemble/react-components';
import { type ChangeEvent, type ReactElement, useCallback, useState } from 'react';

import styles from './index.module.css';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (value: string) => void;
  label?: string;
  labelPosition?: 'left' | 'top';
  inheritFrom?: string;
  canReset: boolean;
  onReset?: () => void;
}
export function ColorPicker({
  canReset,
  inheritFrom,
  label,
  labelPosition = 'top',
  onChange,
  onReset,
  selectedColor,
}: ColorPickerProps): ReactElement {
  const [color, setColor] = useState<string>('#000000');

  const setCurrentColor = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setColor(event.target.value);
    },
    [setColor],
  );

  const onColorChange = useCallback(() => {
    onChange(color);
  }, [color, onChange]);

  if (!label) {
    return (
      <div className="field is-flex is-align-items-stretch mb-0">
        <div className={styles.colorAndReset}>
          <input
            onBlur={onColorChange}
            onChange={setCurrentColor}
            type="color"
            value={selectedColor}
          />
          {canReset ? <IconButton icon="close" onClick={onReset} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} field is-flex is-align-items-stretch mb-0 ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      {label && !inheritFrom ? <label className="label">{label}</label> : null}
      {label && inheritFrom ? (
        <label className="label">
          {label} <span className={styles.inheritFrom}>{inheritFrom}</span>
        </label>
      ) : null}
      <div className={styles.colorAndReset}>
        <input
          onBlur={onColorChange}
          onChange={setCurrentColor}
          type="color"
          value={selectedColor}
        />
        {canReset ? <IconButton icon="close" onClick={onReset} /> : null}
      </div>
    </div>
  );
}
