Remove the Helm values `pgbouncer.auth.existingSecret` and `pgbouncer.auth.userlistKey`: PgBouncer
reads the credentials from `postgresql.auth.existingSecret`
