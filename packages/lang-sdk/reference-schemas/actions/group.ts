import { type OpenAPIV3 } from 'openapi-types';

import { GroupMemberDeleteActionDefinition } from '../../schemas/GroupMemberDeleteActionDefinition.js';
import { GroupMemberInviteActionDefinition } from '../../schemas/GroupMemberInviteActionDefinition.js';
import { GroupMemberQueryActionDefinition } from '../../schemas/GroupMemberQueryActionDefinition.js';
import { GroupMemberRoleUpdateActionDefinition } from '../../schemas/GroupMemberRoleUpdateActionDefinition.js';
import { GroupQueryActionDefinition } from '../../schemas/GroupQueryActionDefinition.js';

export const groupActions: Record<string, OpenAPIV3.SchemaObject> = {
  'group.query': GroupQueryActionDefinition,
  'group.member.invite': GroupMemberInviteActionDefinition,
  'group.member.query': GroupMemberQueryActionDefinition,
  'group.member.delete': GroupMemberDeleteActionDefinition,
  'group.member.role.update': GroupMemberRoleUpdateActionDefinition,
};
