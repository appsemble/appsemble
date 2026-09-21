Remove the bundled Bitnami PostgreSQL dependency chart. The chart connects to an existing PostgreSQL
17 server through `postgresql.host`, `postgresql.port` and `postgresql.auth`, which replace
`global.postgresql.auth` and `postgresql.fullnameOverride`; CloudNativePG is the documented way to
run it
