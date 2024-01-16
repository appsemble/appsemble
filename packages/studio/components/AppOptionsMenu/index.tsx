import { Button, Checkbox, useClickOutside, useToggle } from '@appsemble/react-components';
import { type App as AppType } from '@appsemble/types';
import { type ReactNode, useCallback, useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { AddToCollectionButton } from '../AddToCollectionButton/index.js';

interface AppOptionsMenuProps {
  readonly app: AppType;
  readonly onExport: () => void;
  readonly onChecked: () => void;
  readonly checked: boolean;
  readonly showExport: boolean;
  readonly showExportResources: boolean;
}

export function AppOptionsMenu({
  app,
  checked,
  onChecked,
  onExport,
  showExport,
  showExportResources,
}: AppOptionsMenuProps): ReactNode {
  const { disable, enabled: isActive, toggle } = useToggle(false);

  const handleMenuItemClick = useCallback(
    (action: string) => {
      if (action === 'export') {
        onExport();
      } else if (action === 'checked') {
        onChecked();
      }
      disable();
    },
    [disable, onChecked, onExport],
  );
  const dropdownRef = useRef<HTMLDivElement | null>();

  useClickOutside(dropdownRef, disable);

  return (
    <div
      className={`dropdown ${styles.dropdown} ${
        isActive ? 'is-active' : ''
      } is-pulled-right is-right is-justify-content-flex-end`}
      ref={dropdownRef}
    >
      <div className="dropdown-trigger">
        <Button
          aria-controls="dropdown-menu"
          aria-haspopup="true"
          className="ml-2"
          icon="ellipsis-vertical"
          id="app-options-menu"
          onClick={toggle}
        />
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content px-2">
          <div className={String(styles.exportControls)}>
            {showExport ? (
              <div className="dropdown-item">
                <Button className="is-fullwidth" onClick={() => handleMenuItemClick('export')}>
                  <FormattedMessage {...messages.exportText} />
                </Button>
              </div>
            ) : null}
            {showExportResources ? (
              <Checkbox
                className={`is-inline-block dropdown-item ${styles.checkbox}`}
                label={<FormattedMessage {...messages.exportWithResources} />}
                name="resources"
                onChange={onChecked}
                value={checked}
              />
            ) : null}
          </div>
          <div className="dropdown-item px-0">
            <AddToCollectionButton app={app} className="is-fullwidth" />
          </div>
        </div>
      </div>
    </div>
  );
}
