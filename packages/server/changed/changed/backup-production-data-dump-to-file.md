Dump each database to a file in backup-production-data before uploading it, so a retried upload does
not run pg_dump again and pg_dump never waits on the network
