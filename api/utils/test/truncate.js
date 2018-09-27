import setupModels from '../setupModels';

export default async function truncate() {
  const models = await setupModels(true);

  await Promise.all(Object.entries(models)
    .filter(([key]) => !/^sequelize$/i.test(key))
    .map(([, model]) => model.destroy({ where: {}, force: true })));
}
