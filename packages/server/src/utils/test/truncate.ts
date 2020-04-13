import { getDB } from '../../models';

export default async function truncate(): Promise<void> {
  const db = getDB();
  await db.truncate({ cascade: true, force: true });
}
