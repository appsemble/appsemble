The development server (`appsemble serve`) reflects the request origin in CORS responses, so
credentialed app requests such as `/api/apps/:id/variables` no longer fail against the wildcard.
