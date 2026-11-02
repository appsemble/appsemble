import { type AppDefinition, type AppRole } from '@appsemble/lang-sdk';

type NotificationStrategy = 'login' | 'none' | 'opt-in' | 'startup';

const strategiesByEagerness: NotificationStrategy[] = ['startup', 'login', 'opt-in', 'none'];

/**
 * Get the push notification strategy that applies to an app member.
 *
 * @param notifications The `notifications` property of the app definition.
 * @param appMemberRoles The roles assigned to the app member.
 * @returns The most eager strategy of the member's roles, or `none` if notifications are disabled.
 */
export function getNotificationStrategy(
  notifications: AppDefinition['notifications'],
  appMemberRoles: AppRole[],
): NotificationStrategy {
  if (!notifications) {
    return 'none';
  }
  if (typeof notifications === 'string') {
    return notifications;
  }
  const defaultStrategy = notifications.default ?? 'none';
  const strategies = appMemberRoles.length
    ? appMemberRoles.map((role) => notifications.roles[role] ?? defaultStrategy)
    : [defaultStrategy];
  return strategiesByEagerness.find((strategy) => strategies.includes(strategy))!;
}
