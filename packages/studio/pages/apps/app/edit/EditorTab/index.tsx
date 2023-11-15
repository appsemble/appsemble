import { Icon, Tab } from '@appsemble/react-components';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ReactChild, type ReactNode } from 'react';

interface EditorTabProps {
  readonly children: ReactChild;
  readonly errorCount: number;
  readonly icon: IconName;
  readonly value: string;
}

export function EditorTab({ children, errorCount, icon, value }: EditorTabProps): ReactNode {
  return (
    <Tab href={value} value={value}>
      <Icon icon={icon} />
      {children}
      {errorCount ? <span className="is-size-7 has-text-danger ml-2">{errorCount}</span> : null}
    </Tab>
  );
}
