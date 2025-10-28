{{/*
Expand the name of the chart.
*/}}
{{- define "appsemble.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "appsemble.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "appsemble.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the default labels for a template indented with 4 spaces.
*/}}
{{- define "appsemble.labels" -}}
    app.kubernetes.io/instance: {{ .Release.Name | quote }}
    app.kubernetes.io/managed-by: {{ .Release.Service | quote }}
    app.kubernetes.io/name: {{ include "appsemble.name" . }}
    app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
    helm.sh/chart: {{ include "appsemble.chart" . }}
{{- end -}}

{{/*
Create annotations for GitLab monitoring.
*/}}
{{- define "appsemble.gitlab" -}}
{{ with .Values.gitlab.app }}
app.gitlab.com/app: {{ . | quote }}
{{ end }}
{{ with .Values.gitlab.env }}
app.gitlab.com/env: {{ . | quote }}
{{ end }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "appsemble.tag" -}}
{{- default .Chart.AppVersion .Values.image.tag -}}
{{- end -}}

{{/*
Get the protocol on which Appsemble is accessible.
*/}}
{{- define "appsemble.protocol" -}}
http{{ if or .Values.forceProtocolHttps .Values.ingress.tls }}s{{ end }}://
{{- end -}}

{{/*
Configure the environment variables for Appsemble to connect with the Postgres instance.
*/}}
{{- define "appsemble.postgres" -}}
- name: DATABASE_HOST
  value: {{ .Values.postgresql.fullnameOverride | quote }}
{{ if .Values.postgresSSL }}
- name: DATABASE_SSL
  value: 'true'
{{ end }}
- name: DATABASE_PORT
  value: {{ .Values.global.postgresql.service.ports.postgresql | quote }}
- name: DATABASE_NAME
  value: {{ .Values.global.postgresql.auth.database | quote }}
- name: DATABASE_USER
  value: {{ .Values.global.postgresql.auth.username | quote }}
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.global.postgresql.auth.existingSecret | quote }}
      key: {{ .Values.global.postgresql.auth.secretKeys.userPasswordKey | quote }}
{{- end -}}


{{/*
Configure the environment variables for Appsemble to connect with the Minio instance.
*/}}
{{- define "appsemble.s3" -}}
{{- if .Values.minio.apiIngress.enabled }}
- name: S3_HOST
  value: {{ .Values.minio.apiIngress.hostname | quote }}
- name: S3_PORT
  value: "443"
{{- else }}
{{- with .Values.minio.auth.existingSecret }}
- name: S3_HOST
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: host
- name: S3_PORT
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: port
{{- end }}
{{- end }}
{{- with .Values.minio.auth.existingSecret }}
- name: S3_SECURE
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: secure
- name: S3_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: access-key
- name: S3_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: secret-key
{{- end }}
{{- end -}}


{{/*
Configure the environment variables for Appsemble to enable backups.
*/}}
{{- define "appsemble.backups" -}}
{{- if .Values.backups.enabled }}
- name: BACKUPS_BUCKET
  value: {{ .Values.backups.bucket | quote }}
- name: BACKUPS_FILENAME
  value: {{ .Values.backups.filename | quote }}
- name: BACKUPS_HOST
  value: {{ .Values.backups.host | quote }}
- name: BACKUPS_PORT
  value: {{ .Values.backups.port | quote }}
- name: BACKUPS_SECURE
  value: {{ .Values.backups.secure | quote }}
{{- with .Values.backups.existingSecret }}
- name: BACKUPS_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: access-key
- name: BACKUPS_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: secret-key
{{- end }}
{{- end -}}


{{/*
Configure the environment variable for Appsemble to authenticate incoming Stripe webhooks.
*/}}
{{- define "appsemble.stripeWebhookSecret" -}}
{{- with .Values.stripeWebhookSecret }}
- name: STRIPE_WEBHOOK_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: stripe-webhook-secret
{{- end }}
{{- end }}

{{/*
Configure the environment variable for Appsemble to connect to Stripe.
*/}}
{{- define "appsemble.stripeApiSecretKey" -}}
{{- with .Values.stripeApiSecretKey }}
- name: STRIPE_API_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: stripe-api-secret-key
{{- end }}
{{- end }}

{{/*
Configure the environment variables for Sentry.
*/}}
{{- define "appsemble.sentry" -}}
{{ with .Values.sentry }}
- name: SENTRY_DSN
  valueFrom:
    secretKeyRef:
      name: {{ .secret | quote }}
      key: dsn
{{ with .environment }}
- name: SENTRY_ENVIRONMENT
  value: {{ . | quote }}
{{ end }}
{{ with .allowedDomains }}
- name: SENTRY_ALLOWED_DOMAINS
  value: {{ join "," . | quote }}
{{ end }}
{{ end }}
{{- end -}}
