export default async function truncate(db) {
  return db.truncate({ cascade: true, force: true });
}
