import { Button } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';

interface ListItemProps {
  readonly index: number;
  readonly value: string;
  readonly onChange: (index: number) => void;
}

export function ListItem({ index, onChange, value }: ListItemProps): ReactNode {
  const onClickItem = useCallback(() => {
    onChange(index);
  }, [onChange, index]);

  return (
    <Button className={`dropdown-item pl-5 ${styles.noBorder}`} onClick={onClickItem}>
      {value}
    </Button>
  );
}
