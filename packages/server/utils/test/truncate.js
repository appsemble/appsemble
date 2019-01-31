export default async function truncate(db) {
  await Promise.all(
    Object.values(db.models).map(model => model.destroy({ where: {}, force: true })),
  );
}
