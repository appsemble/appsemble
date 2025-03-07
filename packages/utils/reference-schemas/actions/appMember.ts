import { type OpenAPIV3 } from 'openapi-types';

import { AppMemberCurrentPatchActionDefinition } from '../../api/components/schemas/AppMemberCurrentPatchActionDefinition.js';
import { AppMemberDeleteActionDefinition } from '../../api/components/schemas/AppMemberDeleteActionDefinition.js';
import { AppMemberInviteActionDefinition } from '../../api/components/schemas/AppMemberInviteActionDefinition.js';
import { AppMemberLoginActionDefinition } from '../../api/components/schemas/AppMemberLoginActionDefinition.js';
import { AppMemberLogoutActionDefinition } from '../../api/components/schemas/AppMemberLogoutActionDefinition.js';
import { AppMemberPropertiesPatchActionDefinition } from '../../api/components/schemas/AppMemberPropertiesPatchActionDefinition.js';
import { AppMemberQueryActionDefinition } from '../../api/components/schemas/AppMemberQueryActionDefinition.js';
import { AppMemberRegisterActionDefinition } from '../../api/components/schemas/AppMemberRegisterActionDefinition.js';
import { AppMemberRoleUpdateActionDefinition } from '../../api/components/schemas/AppMemberRoleUpdateActionDefinition.js';

export const appMemberActions: Record<string, OpenAPIV3.SchemaObject> = {
  'app.member.register': AppMemberRegisterActionDefinition,
  'app.member.invite': AppMemberInviteActionDefinition,
  'app.member.login': AppMemberLoginActionDefinition,
  'app.member.logout': AppMemberLogoutActionDefinition,
  'app.member.query': AppMemberQueryActionDefinition,
  'app.member.current.patch': AppMemberCurrentPatchActionDefinition,
  'app.member.role.update': AppMemberRoleUpdateActionDefinition,
  'app.member.properties.patch': AppMemberPropertiesPatchActionDefinition,
  'app.member.delete': AppMemberDeleteActionDefinition,
};
