Remove the bundled Bitnami PostgreSQL dependency chart. The chart connects to an existing PostgreSQL
17 server through `postgresql.host`, `postgresql.port` and `postgresql.auth`, which replace
`global.postgresql.auth` and `postgresql.fullnameOverride`; CloudNativePG is the documented way to
run it. The upgrade removes the PostgreSQL StatefulSet from the release, so move the data across
first: the PostgreSQL deployment documentation describes the migration under "Moving from the
bundled PostgreSQL chart"
