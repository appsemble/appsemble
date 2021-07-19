import { MenuItem, MenuSection } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages';

/**
 * The side menu section that’s rendered in Appsemble Studio by default.
 */
export function SideMenuBase(): ReactElement {
  const { lang } = useParams<{ lang: string }>();

  return (
    <MenuSection>
      <MenuItem exact icon="mobile" to={`/${lang}/apps`}>
        <FormattedMessage {...messages.appStore} />
      </MenuItem>
      <MenuItem icon="cubes" to={`/${lang}/blocks`}>
        <FormattedMessage {...messages.blockStore} />
      </MenuItem>
      <MenuItem icon="briefcase" to={`/${lang}/organizations`}>
        <FormattedMessage {...messages.organizations} />
      </MenuItem>
      <MenuItem icon="book" to={`/${lang}/docs`}>
        <FormattedMessage {...messages.documentation} />
      </MenuItem>
    </MenuSection>
  );
}
