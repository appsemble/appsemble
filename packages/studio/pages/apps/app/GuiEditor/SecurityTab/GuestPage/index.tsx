import { type ReactNode } from 'react';

import { type tabChangeOptions } from '../index.js';

interface GroupsPageProps {
  readonly onChangeTab: (tab: (typeof tabChangeOptions)[number]) => void;
}

export function GroupsPage({ onChangeTab }: GroupsPageProps): ReactNode {
  // eslint-disable-next-line no-console
  console.log(onChangeTab);
  return <div>GroupsPage</div>;
}

// TODO fix this page
// Import { Button } from '@appsemble/react-components';
// import { type ReactNode, useCallback } from 'react';
// import { useIntl } from 'react-intl';
//
// import { messages } from './messages.js';
// import { useApp } from '../../../index.js';
// import { InputList } from '../../Components/InputList/index.js';
// import { OptionalList } from '../../Components/OptionalList/index.js';
// import { type tabChangeOptions } from '../index.js';
//
// const groupsJoinOptions = ['anyone', 'invite'] as const;
// const groupsInviteOptions = ['$group:member', '$group:manager'] as const;
//
// interface GroupsPageProps {
//   readonly onChangeTab: (tab: (typeof tabChangeOptions)[number]) => void;
// }
// export function GroupsPage({ onChangeTab }: GroupsPageProps): ReactNode {
//   const { app, setApp } = useApp();
//   const { formatMessage } = useIntl();
//
//   const onChangeGroupsJoin = useCallback(
//     (index: number) => {
//       if (!app.definition.security.groups) {
//         app.definition.security.groups = { invite: [], join: 'anyone' };
//       }
//       app.definition.security.groups.join = groupsJoinOptions[index];
//       setApp({ ...app });
//     },
//     [app, setApp],
//   );
//
//   const onChangeGroupsCreate = useCallback(
//     (selectedRoles: string[]) => {
//       if (!app.definition.security.groups) {
//         app.definition.security.groups = { invite: [], join: 'anyone', create: [] };
//       }
//       if (!app.definition.security.groups.create) {
//         app.definition.security.groups.create = [];
//       }
//       app.definition.security.groups.create = [...selectedRoles];
//       setApp({ ...app });
//     },
//     [app, setApp],
//   );
//
//   const onChangeGroupsInvite = useCallback(
//     (selectedRoles: string[]) => {
//       if (!app.definition.security.groups) {
//         app.definition.security.groups = { invite: [], join: 'anyone' };
//       }
//       app.definition.security.groups.invite = [...selectedRoles];
//       setApp({ ...app });
//     },
//     [app, setApp],
//   );
//
//   if (!app.definition.security) {
//     return (
//       <>
//         <p className="help is-danger">{formatMessage(messages.noRoles)}</p>
//         <Button
//           className="is-primary"
//           component="a"
//           icon="add"
//           onClick={() => onChangeTab('createRole')}
//         >
//           {formatMessage(messages.createNewRole)}
//         </Button>
//       </>
//     );
//   }
//
//   return (
//     <>
//       <InputList
//         label={formatMessage(messages.groupsJoinLabel)}
//         labelPosition="top"
//         onChange={onChangeGroupsJoin}
//         options={groupsJoinOptions}
//         value={app.definition.security?.groups?.join || groupsJoinOptions[0]}
//       />
//       <OptionalList
//         addNewItemLabel={formatMessage(messages.groupsAddRole)}
//         label={formatMessage(messages.groupsCreateLabel)}
//         labelPosition="top"
//         onNewSelected={onChangeGroupsCreate}
//         options={Object.entries(app.definition.security?.roles || [])
//           .map(([key]) => key)
//           .filter((role) => !app.definition.security?.groups?.create?.includes(role))}
//         selected={app.definition.security?.groups?.create || []}
//       />
//       <OptionalList
//         addNewItemLabel={formatMessage(messages.groupsAddRole)}
//         label={formatMessage(messages.groupsInviteLabel)}
//         labelPosition="top"
//         onNewSelected={onChangeGroupsInvite}
//         options={Object.entries(app.definition.security?.roles || [])
//           .map(([key]) => key)
//           .concat(groupsInviteOptions)
//           .filter((role) => !app.definition.security?.groups?.invite?.includes(role))}
//         selected={app.definition.security?.groups?.invite || []}
//       />
//     </>
//   );
// }
