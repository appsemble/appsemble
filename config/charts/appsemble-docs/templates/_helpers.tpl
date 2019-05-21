{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "docs.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "docs.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
The Docker image including repository and tag.
*/}}
{{- define "image" -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag | quote -}}
{{- end -}}

{{/*
The fully qualified host name of the documentation instance.
*/}}
{{- define "host" -}}
{{- printf "%s.appsemble.app" .Release.Name -}}
{{- end -}}

{{/*
The URL to the docs, including the host name and protocol.
*/}}
{{- define "url" -}}
{{- printf "https://%s" (include "host" .) -}}
{{- end -}}
