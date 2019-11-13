import { IconName, IconPrefix } from '@fortawesome/fontawesome-common-types';
import classNames from 'classnames';
import * as React from 'react';

import styles from './IconButton.css';

interface IconButtonProps {
  className?: string;
  icon: IconName;
  onClick: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  prefix?: IconPrefix;
}

export default function IconButton({
  className,
  icon,
  onClick,
  prefix = 'fas',
}: IconButtonProps): React.ReactElement {
  return (
    <button className={classNames('icon', styles.root, className)} onClick={onClick} type="button">
      <i className={`${prefix} fa-${icon}`} />
    </button>
  );
}
