import { type ExtendedTeam, type GetAppTeamsParams } from '@appsemble/node-utils';

export function getAppTeams({ context }: GetAppTeamsParams): Promise<ExtendedTeam[]> {
  return Promise.resolve(context.appTeams);
}
