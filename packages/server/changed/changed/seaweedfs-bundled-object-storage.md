Replace the bundled Bitnami MinIO dependency chart with SeaweedFS (Helm values `seaweedfs.*`), which
runs one pod backed by one volume and implements the S3 flexible checksums. The upgrade removes the
MinIO Deployment and starts SeaweedFS with an empty volume, so copy the objects across first; the
chart README describes the migration under "Moving from the bundled MinIO to SeaweedFS"
