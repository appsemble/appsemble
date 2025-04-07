import { type OpenAPIV3 } from 'openapi-types';

import { AppMemberCurrentPatchActionDefinition } from '../../schemas/AppMemberCurrentPatchActionDefinition.js';
import { AppMemberDeleteActionDefinition } from '../../schemas/AppMemberDeleteActionDefinition.js';
import { AppMemberInviteActionDefinition } from '../../schemas/AppMemberInviteActionDefinition.js';
import { AppMemberLoginActionDefinition } from '../../schemas/AppMemberLoginActionDefinition.js';
import { AppMemberLogoutActionDefinition } from '../../schemas/AppMemberLogoutActionDefinition.js';
import { AppMemberPropertiesPatchActionDefinition } from '../../schemas/AppMemberPropertiesPatchActionDefinition.js';
import { AppMemberQueryActionDefinition } from '../../schemas/AppMemberQueryActionDefinition.js';
import { AppMemberRegisterActionDefinition } from '../../schemas/AppMemberRegisterActionDefinition.js';
import { AppMemberRoleUpdateActionDefinition } from '../../schemas/AppMemberRoleUpdateActionDefinition.js';

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
