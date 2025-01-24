import { type OpenAPIV3 } from 'openapi-types';

import { GroupMemberDeleteActionDefinition } from '../../api/components/schemas/GroupMemberDeleteActionDefinition.js';
import { GroupMemberInviteActionDefinition } from '../../api/components/schemas/GroupMemberInviteActionDefinition.js';
import { GroupMemberQueryActionDefinition } from '../../api/components/schemas/GroupMemberQueryActionDefinition.js';
import { GroupMemberRoleUpdateActionDefinition } from '../../api/components/schemas/GroupMemberRoleUpdateActionDefinition.js';
import { GroupQueryActionDefinition } from '../../api/components/schemas/GroupQueryActionDefinition.js';

export const groupActions: Record<string, OpenAPIV3.SchemaObject> = {
  'group.query': GroupQueryActionDefinition,
  'group.member.invite': GroupMemberInviteActionDefinition,
  'group.member.query': GroupMemberQueryActionDefinition,
  'group.member.delete': GroupMemberDeleteActionDefinition,
  'group.member.role.update': GroupMemberRoleUpdateActionDefinition,
};
