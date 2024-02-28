import { MenuItem, MenuSection } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

/**
 * The side menu section that’s rendered in Appsemble Studio by default.
 */
export function SideMenuBase(): ReactNode {
  return (
    <MenuSection>
      <MenuItem end icon="mobile" to="apps">
        <FormattedMessage {...messages.appStore} />
      </MenuItem>
      <MenuItem icon="cubes" to="blocks">
        <FormattedMessage {...messages.blockStore} />
      </MenuItem>
      <MenuItem icon="briefcase" to="organizations">
        <FormattedMessage {...messages.organizations} />
      </MenuItem>
      <MenuItem icon="book" to="docs">
        <FormattedMessage {...messages.documentation} />
      </MenuItem>
      <MenuItem icon="graduation-cap" to="trainings">
        <FormattedMessage {...messages.training} />
      </MenuItem>
    </MenuSection>
  );
}
