import { type OpenAPIV3 } from 'openapi-types';

import { GroupMemberCreateActionDefinition } from '../../schemas/actions/GroupMemberCreateActionDefinition.js';
import { GroupMemberDeleteActionDefinition } from '../../schemas/actions/GroupMemberDeleteActionDefinition.js';
import { GroupMemberInviteActionDefinition } from '../../schemas/actions/GroupMemberInviteActionDefinition.js';
import { GroupMemberQueryActionDefinition } from '../../schemas/actions/GroupMemberQueryActionDefinition.js';
import { GroupMemberRoleUpdateActionDefinition } from '../../schemas/actions/GroupMemberRoleUpdateActionDefinition.js';
import { GroupQueryActionDefinition } from '../../schemas/actions/GroupQueryActionDefinition.js';
import { GroupSelectedUpdateActionDefinition } from '../../schemas/actions/GroupSelectedUpdateActionDefinition.js';

export const groupActions: Record<string, OpenAPIV3.SchemaObject> = {
  'group.query': GroupQueryActionDefinition,
  'group.selected.update': GroupSelectedUpdateActionDefinition,
  'group.member.invite': GroupMemberInviteActionDefinition,
  'group.member.query': GroupMemberQueryActionDefinition,
  'group.member.delete': GroupMemberDeleteActionDefinition,
  'group.member.role.update': GroupMemberRoleUpdateActionDefinition,
  'group.member.create': GroupMemberCreateActionDefinition,
};
