import { Icon, Tab } from '@appsemble/react-components';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type ReactChild, type ReactElement } from 'react';

interface EditorTabProps {
  children: ReactChild;
  errorCount: number;
  icon: IconName;
  value: string;
}

export function EditorTab({ children, errorCount, icon, value }: EditorTabProps): ReactElement {
  return (
    <Tab href={value} value={value}>
      <Icon icon={icon} />
      {children}
      {errorCount ? <span className="is-size-7 has-text-danger ml-2">{errorCount}</span> : null}
    </Tab>
  );
}
