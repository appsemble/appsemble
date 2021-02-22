import { promises as fs } from 'fs';
import { join } from 'path';

import { AppsembleError, logger } from '@appsemble/node-utils';

/**
 * This script aims to help keep existing translations if a messages file has been moved.
 *
 * Running this script requires these replacements to have been implemented.
 *
 * The following example shows how to fix up messages if a messages file is renamed from
 * `packages/studio/src/compponents/AppContext/messages.ts` to
 * `packages/studio/src/pages/apps/app/messages.ts`.
 *
 * @example
 * ```ts
 * const replacements = [
 *   [/^studio\.src\.components\.AppContext\.(.*)/, 'studio.src.pages.apps.app.$1'],
 * ];
 * ```
 *
 * Now running the following command will fix the message keys:
 *
 * @example
 * ```sh
 * yarn scripts rewrite-messages
 * ```
 */
const replacements: [RegExp, string][] = [
  [/^studio\.src\.components\.AppContext\.(.*)/, 'studio.src.pages.apps.app.$1'],
  [/^studio\.src\.components\.AppDetails\.(.*)/, 'studio.src.pages.apps.app.Index.$1'],
  [/^studio\.src\.components\.AppList\.(.*)/, 'studio.src.pages.apps.Index.$1'],
  [/^studio\.src\.components\.AppSettings\.(.*)/, 'studio.src.pages.apps.app.settings.$1'],
  [/^studio\.src\.components\.AppSecrets\.(.*)/, 'studio.src.pages.apps.app.secrets.$1'],
  [/^studio\.src\.components\.Assets\.(.*)/, 'studio.src.pages.apps.app.assets.$1'],
  [/^studio\.src\.components\.BlockDetails\.(.*)/, 'studio.src.pages.blocks.block.$1'],
  [/^studio\.src\.components\.BlockList\.(.*)/, 'studio.src.pages.blocks.Index.$1'],
  [/^studio\.src\.components\.CMS\.(.*)/, 'studio.src.pages.apps.app.resources.$1'],
  [/^studio\.src\.components\.CMSRoot\.(.*)/, 'studio.src.pages.apps.app.resources.Index.$1'],
  [
    /^studio\.src\.components\.ClientCredentials\.(.*)/,
    'studio.src.pages.settings.client-credentials.$1',
  ],
  [/^studio\.src\.components\.Docs\.(.*)/, 'studio.src.pages.docs.$1'],
  [/^studio\.src\.components\.EditPassword\.(.*)/, 'studio.src.pages.edit-password.$1'],
  [/^studio\.src\.components\.Editor\.(.*)/, 'studio.src.pages.apps.app.edit.$1'],
  [/^studio\.src\.components\.ForwardOAuth2Login\.(.*)/, 'studio.src.pages.connect.type.$1'],
  [/^studio\.src\.components\.Login\.(.*)/, 'studio.src.pages.login.$1'],
  [/^studio\.src\.components\.MessageEditor\.(.*)/, 'studio.src.pages.apps.app.translations.$1'],
  [/^studio\.src\.components\.Notifications\.(.*)/, 'studio.src.pages.apps.app.notifications.$1'],
  [/^studio\.src\.components\.OAuthSettings\.(.*)/, 'studio.src.pages.settings.social.$1'],
  [/^studio\.src\.components\.OpenIDLogin\.(.*)/, 'studio.src.pages.connect.Index.$1'],
  [/^studio\.src\.components\.OrganizationInvite\.(.*)/, 'studio.src.pages.organization-invite.$1'],
  [
    /^studio\.src\.components\.OrganizationSettings\.(.*)/,
    'studio.src.pages.settings.organizations.organization.$1',
  ],
  [
    /^studio\.src\.components\.OrganizationsList\.(.*)/,
    'studio.src.pages.settings.organizations.Index.$1',
  ],
  [/^studio\.src\.components\.Register\.(.*)/, 'studio.src.pages.register.$1'],
  [/^studio\.src\.components\.ResetPassword\.(.*)/, 'studio.src.pages.reset-password.$1'],
  [
    /^studio\.src\.components\.ResourceTable\.(.*)/,
    'studio.src.pages.apps.app.resources.resource.$1',
  ],
  [/^studio\.src\.components\.Roles\.(.*)/, 'studio.src.pages.apps.app.roles.$1'],
  [/^studio\.src\.components\.Routes\.BlockRoutes\.(.*)/, 'studio.src.pages.blocks.$1'],
  [/^studio\.src\.components\.Routes\.AppRoutes\.(.*)/, 'studio.src.pages.apps.$1'],
  [/^studio\.src\.components\.SAMLResponse\.(.*)/, 'studio.src.pages.saml.$1'],
  [/^studio\.src\.components\.SentryFeedback\.(.*)/, 'studio.src.pages.feedback.$1'],
  [/^studio\.src\.components\.Settings\.(.*)/, 'studio.src.pages.settings.$1'],
  [
    /^studio\.src\.components\.Teams\.AddTeamMemberModal\.(.*)/,
    'studio.src.pages.apps.app.teams.team.AddTeamMemberModal.$1',
  ],
  [
    /^studio\.src\.components\.Teams\.AnnotationsTable\.(.*)/,
    'studio.src.pages.apps.app.teams.team.AnnotationsTable.$1',
  ],
  [
    /^studio\.src\.component(?:s\.Team){2}Settings\.(.*)/,
    'studio.src.pages.apps.app.teams.team.$1',
  ],
  [
    /^studio\.src\.component(?:s\.Team){2}MemberRow\.(.*)/,
    'studio.src.pages.apps.app.teams.team.TeamMemberRow.$1',
  ],
  [/^studio\.src\.component(?:s\.Team){2}sList\.(.*)/, 'studio.src.pages.apps.app.teams.Index.$1'],
  [/^studio\.src\.components\.UserSettings\.(.*)/, 'studio.src.pages.settings.user.$1'],
  [/^studio\.src\.components\.VerifyEmail\.(.*)/, 'studio.src.pages.verify.$1'],
];

export const command = 'rewrite-messages';
export const description = `Fix i18n message keys for moved files. Open ${__filename} for details`;

const translationdDir = 'translations';

export async function handler(): Promise<void> {
  const filenames = await fs.readdir(translationdDir);

  if (!replacements.length) {
    throw new AppsembleError(`Implement replacements in ${__filename} to run this command.`);
  }

  await Promise.all(
    filenames.map(async (filepath) => {
      const path = join(translationdDir, filepath);
      const pldMessages = JSON.parse(await fs.readFile(path, 'utf8'));
      const newMessages = Object.fromEntries(
        Object.entries(pldMessages).map(([oldKey, value]) => {
          const replacement = replacements.find(([pattern]) => pattern.test(oldKey));
          if (replacement) {
            const newKey = oldKey.replace(...replacement);
            logger.info(`${path}: ${oldKey} → ${newKey}`);
            return [newKey, value];
          }
          return [oldKey, value];
        }),
      );
      await fs.writeFile(
        path,
        `${JSON.stringify(newMessages, Object.keys(newMessages).sort(), 2)}\n`,
      );
    }),
  );
}
