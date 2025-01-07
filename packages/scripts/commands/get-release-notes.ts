import { getReleaseNotes } from '../lib/changelog.js';

export const command = 'get-release-notes';
export const description = 'Print release notes for the latest release to stdout';

export async function handler(): Promise<void> {
  const releaseNotes = await getReleaseNotes();
  console.log(releaseNotes);
}
