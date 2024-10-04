import {
  Icon,
  type MinimalHTMLElement,
  ModalCard,
  NavbarDropdown,
  NavbarItem,
  SelectField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  useToggle,
} from '@appsemble/react-components';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { DemoLogin } from '../DemoLogin/index.js';

export function ProfileDropdown(): ReactNode {
  const { formatMessage } = useIntl();
  const { definition } = useAppDefinition();
  const {
    appMemberGroups,
    appMemberInfo,
    appMemberSelectedGroup,
    isLoggedIn,
    logout,
    setAppMemberSelectedGroup,
  } = useAppMember();
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const showLogin = definition.security;
  const { layout } = definition;

  const groupSelectionToggle = useToggle();
  const demoLoginToggle = useToggle();

  const [localSelectedGroup, setLocalSelectedGroup] = useState(appMemberSelectedGroup);

  const changeLocalSelectedGroup = (event: ChangeEvent<MinimalHTMLElement>): void => {
    setLocalSelectedGroup(
      appMemberGroups.find((group) => group.id === Number(event.target.value)) || null,
    );
  };

  const handleGroupChange = useCallback(() => {
    setAppMemberSelectedGroup(
      appMemberGroups.find((group) => group.id === localSelectedGroup?.id) || null,
    );
    groupSelectionToggle.disable();
    navigate('/');
  }, [
    groupSelectionToggle,
    appMemberGroups,
    localSelectedGroup?.id,
    navigate,
    setAppMemberSelectedGroup,
  ]);

  if (
    !showLogin ||
    pathname.includes(`${lang}/Login`) ||
    (layout?.login != null && layout?.login !== 'navbar')
  ) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="navbar-item is-paddingless">
        <Link className={styles.login} to={`/${lang}/Login`}>
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
        {Boolean(appMemberGroups?.length) && (
          <NavbarItem icon="wrench" onClick={groupSelectionToggle.enable}>
            {appMemberSelectedGroup ? (
              <FormattedMessage
                {...messages.changeSelectedGroup}
                values={{ selectedGroupName: appMemberSelectedGroup?.name }}
              />
            ) : (
              <FormattedMessage {...messages.selectGroup} />
            )}
          </NavbarItem>
        )}
        {(layout?.settings ?? 'navbar') === 'navbar' && (
          <NavbarItem icon="wrench" to={`/${lang}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </NavbarItem>
        )}
        {(layout?.feedback ?? 'navbar') === 'navbar' && sentryDsn ? (
          <>
            {(layout?.settings ?? 'navbar') === 'navbar' ? <hr className="navbar-divider" /> : null}
            <NavbarItem icon="comment" to={`/${lang}/Feedback`}>
              <FormattedMessage {...messages.feedback} />
            </NavbarItem>
          </>
        ) : null}
        {showDemoLogin ? (
          <>
            {(layout?.settings ?? 'navbar') === 'navbar' ||
            (layout?.feedback === 'navbar' && sentryDsn) ? (
              <hr className="navbar-divider" />
            ) : null}
            <NavbarItem dataTestId="change-role" onClick={demoLoginToggle.enable}>
              <FormattedMessage {...messages.demoLogin} />
            </NavbarItem>
          </>
        ) : null}
        {showLogin ? (
          <>
            {(layout?.settings ?? 'navbar') === 'navbar' || layout?.feedback === 'navbar' ? (
              <hr className="navbar-divider" />
            ) : null}
            {}
            <NavbarItem icon="sign-out-alt" onClick={logout}>
              <FormattedMessage {...messages.logoutButton} />
            </NavbarItem>
          </>
        ) : null}
      </NavbarDropdown>
      <ModalCard
        component={SimpleForm}
        defaultValues={{ groupId: appMemberSelectedGroup?.id }}
        isActive={groupSelectionToggle.enabled}
        onClose={groupSelectionToggle.disable}
        onSubmit={handleGroupChange}
      >
        <div className="mb-6">
          <SimpleFormField
            component={SelectField}
            disabled={appMemberGroups.length < 1}
            label={<FormattedMessage {...messages.selectGroup} />}
            name="groupId"
            onChange={changeLocalSelectedGroup}
            required
          >
            {appMemberGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} - {group.role}
              </option>
            ))}
            <option key="no-group" value={-1}>
              <FormattedMessage {...messages.noGroup} />
            </option>
          </SimpleFormField>
          <SimpleSubmit allowPristine={false} dataTestId="changeGroup">
            <FormattedMessage {...messages.changeGroup} />
          </SimpleSubmit>
        </div>
      </ModalCard>
      <DemoLogin modal={demoLoginToggle} />
    </>
  );
}
