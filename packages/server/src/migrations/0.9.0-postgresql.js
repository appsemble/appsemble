function error() {
  throw new Error(
    'In version 0.9.0 Appsemble migrated from MySQL to PostgreSQL. This migration needs to be applied manually.',
  );
}

export default {
  key: '0.9.0',
  up: error,
  down: error,
};
