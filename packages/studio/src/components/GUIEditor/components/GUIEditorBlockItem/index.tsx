import { Icon, useValuePicker } from '@appsemble/react-components';
import type { BlockManifest } from '@appsemble/types';
import { stripBlockName } from '@appsemble/utils';
import classNames from 'classnames';
import React, { ReactElement, useCallback } from 'react';

import styles from './index.css';

interface GUIEditorBlockItemProps {
  value: BlockManifest;
}

export default function GUIEditorBlockItem({ value }: GUIEditorBlockItemProps): ReactElement {
  const { name, onChange, value: currentValue } = useValuePicker();

  const handleChange = useCallback((event) => onChange(event, value), [onChange, value]);

  return (
    <label
      className={classNames('card mb-5 ml-5 is-flex', styles.blockFrame, {
        [styles.selected]: value === currentValue,
      })}
    >
      <div className="card-content">
        <Icon icon="box" size="medium" />
        <span className="subtitle">{stripBlockName(value.name)}</span>
        <input
          checked={value === currentValue}
          hidden
          name={name}
          onChange={handleChange}
          type="radio"
          value={name}
        />
      </div>
    </label>
  );
}
