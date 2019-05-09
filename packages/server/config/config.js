module.exports = {
  development: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'appsemble',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: process.env.DATABASE_PORT || 3306,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
  },
  production: {
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'appsemble',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: process.env.DATABASE_PORT || 3306,
    dialect: process.env.DATABASE_DIALECT || 'mysql',
  },
};
