import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  roleAlreadyExists: 'Role already exists',
  roleNameLabel: 'Name',
  cancelRoleNameButton: 'Cancel',
  editRoleNameButton: 'Edit',
  editNameRoleTitle: 'Edit role name:',
  editRoleNameDescription: 'Changing a role name will change all of its references in the app.',
  defaultPageLabel: 'Default Page',
  noneLabel: 'None',
  roleDescriptionLabel: 'Description',
  roleInheritedLabel: 'Inherits from',
  deleteRoleButton: 'Delete role',
  roleDeleted: 'The role {name} has been deleted.',
  deleteRole: 'Delete role',
  deleteRoleWarning:
    'Are you sure you want to delete this role and all of its references in the app?',
  cancelDeleteRole: 'Cancel',
  forceDeleteRole: 'Force Delete',
  deleteRoleReferences: 'References to this role:',
  deleteRoleInherited: '"{roleName}" is being inherited by the following roles:',
  deleteRoleInTeamsCreate: '"{roleName}" is being used in in Teams Create.',
  deleteRoleInTeamsInvite: '"{roleName}" is being used in in Teams Invite.',
  deleteRoleResourceRoles: 'The following resources are using the role "{roleName}":',
  deleteRoleResourceViews: 'The following resource views are using the role "{roleName}":',
  deleteRoleResourceQuery: 'The following resource queries are using the role "{roleName}":',
  deleteRolePages: 'The following pages are using the role "{roleName}":',
  deleteRoleBlocks: 'The following blocks are using the role "{roleName}":',
<<<<<<< HEAD
=======
  lastRole:
    'You cannot delete this role because it is the last one in the app. You must have at least one role in the app.',
>>>>>>> 54f52d664 (Add translation keys and delete unused messages)
  deleteRoleInAppRoles: '"{roleName}" is being used in the app\'s roles.',
  deleteRoleInDefaultRole: '"{roleName}" is being used as the app\'s default role.',
});
