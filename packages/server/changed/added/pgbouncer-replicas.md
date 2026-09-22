Add `pgbouncer.replicaCount` to run several PgBouncer replicas, spread across nodes and guarded by a
PodDisruptionBudget, which share the `pgbouncer.maxUserConnections` budget
