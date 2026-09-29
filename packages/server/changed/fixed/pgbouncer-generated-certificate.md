Generate the self-signed PgBouncer certificate in each PgBouncer pod instead of in a rendered
Secret, which changed on every render under ArgoCD and kept the application out of sync
