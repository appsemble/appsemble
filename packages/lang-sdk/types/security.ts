import { type AppPermission } from './permission.js';
import {
  type OwnResourceAction,
  type ResourceAction,
  type ResourceViewAction,
} from './resource.js';
import { type AppRole, type PredefinedAppRole } from './roles.js';

export type CustomAppResourcePermission = `$resource:${string}:${ResourceAction}`;

export type CustomAppOwnResourcePermission = `$resource:${string}:own:${OwnResourceAction}`;

export type CustomAppResourceViewPermission = `$resource:${string}:${ResourceViewAction}:${string}`;

export type CustomAppGuestPermission =
  | AppPermission
  | CustomAppResourcePermission
  | CustomAppResourceViewPermission;

export type CustomAppPermission = CustomAppGuestPermission | CustomAppOwnResourcePermission;

export interface GuestDefinition {
  permissions?: CustomAppPermission[];
  inherits?: AppRole[];
}

export interface CronSecurityDefinition {
  permissions?: CustomAppPermission[];
  inherits?: AppRole[];
}

export interface RoleDefinition {
  description?: string;
  defaultPage?: string;
  inherits?: AppRole[];
  permissions?: CustomAppPermission[];
}

export type SecurityPolicy = 'everyone' | 'invite' | 'organization';

export interface MinimalSecurity {
  guest: GuestDefinition;

  cron?: CronSecurityDefinition;
  default?: {
    role: AppRole;
    policy?: SecurityPolicy;
  };

  roles?: Record<Exclude<string, PredefinedAppRole>, RoleDefinition>;
}

export interface StrictSecurity {
  guest?: GuestDefinition;

  cron?: CronSecurityDefinition;
  default: {
    role: AppRole;
    policy?: SecurityPolicy;
  };

  roles: Record<string, RoleDefinition>;
}

export type Security = MinimalSecurity | StrictSecurity;
