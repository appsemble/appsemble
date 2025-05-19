import { type OpenAPIV3 } from 'openapi-types';

import { AppMemberCurrentPatchActionDefinition } from '../../schemas/actions/AppMemberCurrentPatchActionDefinition.js';
import { AppMemberDeleteActionDefinition } from '../../schemas/actions/AppMemberDeleteActionDefinition.js';
import { AppMemberInviteActionDefinition } from '../../schemas/actions/AppMemberInviteActionDefinition.js';
import { AppMemberLoginActionDefinition } from '../../schemas/actions/AppMemberLoginActionDefinition.js';
import { AppMemberLogoutActionDefinition } from '../../schemas/actions/AppMemberLogoutActionDefinition.js';
import { AppMemberPropertiesPatchActionDefinition } from '../../schemas/actions/AppMemberPropertiesPatchActionDefinition.js';
import { AppMemberQueryActionDefinition } from '../../schemas/actions/AppMemberQueryActionDefinition.js';
import { AppMemberRegisterActionDefinition } from '../../schemas/actions/AppMemberRegisterActionDefinition.js';
import { AppMemberRoleUpdateActionDefinition } from '../../schemas/actions/AppMemberRoleUpdateActionDefinition.js';

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
