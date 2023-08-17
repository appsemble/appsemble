import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';

import styles from './index.module.css';

interface TreeListProps {
  readonly label: string;
  readonly options: readonly string[];
  readonly onChange: (index: number) => void;
  readonly isSelected: boolean;
  readonly onClick?: () => void;
  readonly value: string;
}

export function TreeList({
  isSelected,
  label,
  onChange,
  onClick,
  options,
  value,
}: TreeListProps): ReactElement {
  return (
    <>
      <Button
        className={`${styles.treeListTop} ${isSelected ? 'is-link' : ''}`}
        icon={options.length > 0 ? 'chevron-down' : undefined}
        iconPosition="left"
        onClick={onClick}
      >
        {label}
      </Button>
      {options.map((option, index) => (
        <Button
          className={`${styles.treeListItem} ${value === option && isSelected ? 'is-info' : ''}`}
          key={option}
          onClick={() => onChange(index)}
        >
          {option}
        </Button>
      ))}
    </>
  );
}
