Point the Helm liveness and startup probes at `/health/live` and the readiness probe at
`/health/ready`, so a database or Valkey outage removes pods from the Service instead of restarting
them
