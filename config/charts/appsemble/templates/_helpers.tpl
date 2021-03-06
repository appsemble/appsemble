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
http{{ if .Values.ingress.tls }}s{{ end }}://
{{- end -}}
