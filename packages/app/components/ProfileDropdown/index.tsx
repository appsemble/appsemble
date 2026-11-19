import { Icon, NavbarDropdown, useToggle } from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { Link } from 'wouter-preact';

import styles from './index.module.css';
import { messages } from './messages.js';
import { FormattedMessage, useIntl } from '../IntlProvider/index.js';
import { showDemoLogin } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { ProfileMenuItems, useProfileMenu } from '../ProfileMenu/index.js';

export function ProfileDropdown(): VNode | null {
  const { formatMessage } = useIntl();
  const { appMemberInfo } = useAppMember();
  const profileMenu = useProfileMenu();
  const demoLoginToggle = useToggle();

  if (!profileMenu) {
    return null;
  }

  if (!profileMenu.isLoggedIn) {
    return (
      <div className="navbar-item is-paddingless">
        <Link className={styles.login} to={profileMenu.loginPath}>
          <div
            className={`is-flex is-justify-content-center is-align-items-center px-4 ${styles.loginText}`}
          >
            <FormattedMessage {...messages.login} />
          </div>
        </Link>
      </div>
    );
  }

  return (
    <>
      {profileMenu.memberName ? (
        <span className="m-1 is-size-6 is-align-content-center">{profileMenu.memberName}</span>
      ) : null}
      <NavbarDropdown
        className={`is-right ${styles.dropdown}`}
        label={
          <figure className="image is-32x32 is-clipped">
            {appMemberInfo?.picture ? (
              <img
                alt={formatMessage(messages.pfp)}
                className={`is-rounded ${styles.gravatar}`}
                src={appMemberInfo.picture}
              />
            ) : (
              <Icon
                className={`is-rounded has-background-grey-dark has-text-white-ter ${styles.gravatarFallback}`}
                icon="user"
              />
            )}
          </figure>
        }
      >
        <ProfileMenuItems onDemoLogin={demoLoginToggle.enable} />
      </NavbarDropdown>
      {showDemoLogin ? <DemoLogin modal={demoLoginToggle} /> : null}
    </>
  );
}
