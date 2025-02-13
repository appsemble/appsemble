import { NavLink } from '@appsemble/react-components';
import { type TrainingStatus } from '@appsemble/types';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { StatusCircle } from '../StatusCircle/index.js';

interface TrainingModuleNodeProps {
  readonly data: {
    title: string;
    chapterHead?: boolean;
    docPath?: string;
    status: TrainingStatus;
  };
}

function renderTitle(
  title: string,
  docPath: string,
  blocked: boolean,
  chapterHead: boolean,
): ReactNode {
  if (chapterHead) {
    return <h1 className={`is-size-4 ${styles.nodeTitle}`}>{title}</h1>;
  }
  if (blocked) {
    return <span className={styles.nodeTitle}>{title}</span>;
  }

  return (
    <NavLink to={docPath}>
      <span className={styles.nodeTitle}>{title}</span>
    </NavLink>
  );
}

export function TrainingModuleNode({ data }: TrainingModuleNodeProps): ReactNode {
  const { chapterHead = false, docPath, status, title } = data;
  const { formatMessage } = useIntl();

  return (
    <div
      className={`${styles.root} ${status === 'blocked' ? styles.disabled : ''} ${chapterHead ? styles.notClickable : ''}`}
      title={String(status === 'blocked' ? formatMessage(messages.chapterBlocked) : '')}
    >
      <StatusCircle status={status} type={chapterHead ? 'large' : 'small'} />
      {renderTitle(title, docPath, status === 'blocked', chapterHead)}
    </div>
  );
}
