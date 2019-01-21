const { CI_ENVIRONMENT_SLUG } = process.env;

export default {
  apiVersion: 'extensions/v1beta1',
  kind: 'Deployment',
  metadata: {
    name: `${CI_ENVIRONMENT_SLUG}-mysql`,
    labels: {
      app: CI_ENVIRONMENT_SLUG,
      tier: 'mysql',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: CI_ENVIRONMENT_SLUG,
        tier: 'mysql',
      },
    },
    template: {
      metadata: {
        labels: {
          app: CI_ENVIRONMENT_SLUG,
          tier: 'mysql',
        },
      },
      spec: {
        containers: [
          {
            image: 'mysql:8',
            name: 'mysql',
            // Needed for NodeJS mysql,
            // https://github.com/mysqljs/mysql/issues/1959
            // https://github.com/mysqljs/mysql/pull/1962
            // https://mysqlserverteam.com/upgrading-to-mysql-8-0-default-authentication-plugin-considerations/
            args: ['--default-authentication-plugin=mysql_native_password'],
            env: [
              {
                name: 'MYSQL_RANDOM_ROOT_PASSWORD',
                value: 'yes',
              },
              {
                name: 'MYSQL_DATABASE',
                valueFrom: { secretKeyRef: { name: 'database', key: 'database' } },
              },
              {
                name: 'MYSQL_USER',
                valueFrom: { secretKeyRef: { name: 'database', key: 'user' } },
              },
              {
                name: 'MYSQL_PASSWORD',
                valueFrom: { secretKeyRef: { name: 'database', key: 'password' } },
              },
            ],
          },
        ],
        // The exposed port of the MySQL database.
        ports: { containerPort: 3306 },
        resources: {
          requests: {
            cpu: '250m',
            memory: '1G',
          },
          limits: {
            cpu: 1,
            memory: '1G',
          },
        },
      },
    },
  },
};
