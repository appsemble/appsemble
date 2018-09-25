import setupModels from '../setupModels';

export default async function truncate() {
  const models = await setupModels(true);

  return Object.keys(models).map(async (key) => {
    if (['sequelize', 'Sequelize'].includes(key)) {
      return null;
    }

    const result = await models[key].destroy({ where: {}, force: true });
    console.log(`Truncating ${key}, result from truncate: ${result}`);
    return result;
  });
}
