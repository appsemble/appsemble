import { type TrainingStatus } from '@appsemble/types';
import { type ReactNode } from 'react';
import { Handle, Position } from 'reactflow';

import styles from './index.module.css';

export interface StatusCircleProps {
  readonly status: TrainingStatus;
  readonly type: 'large' | 'small';
}

export function StatusCircle({ status, type }: StatusCircleProps): ReactNode {
  const size = type === 'large' ? styles.large : styles.small;

  let color;
  switch (status) {
    case 'completed':
      color = styles.green;
      break;
    case 'in progress':
      color = styles.orange;
      break;
    case 'blocked':
      color = styles.gray;
      break;
    default:
      color = styles.white;
  }

  return (
    <div className={styles.circleWrapper}>
      <div className={`${styles.statusCircle} ${size} ${color}`}>
        <Handle className={styles.handle} isConnectable position={Position.Top} type="target" />
        <Handle className={styles.handle} isConnectable position={Position.Bottom} type="source" />
      </div>
    </div>
  );
}
