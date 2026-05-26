{{- define "shop-console.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "shop-console.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "shop-console.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "shop-console.apiLabels" -}}
app.kubernetes.io/name: {{ include "shop-console.name" . }}
app.kubernetes.io/component: api
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "shop-console.mongoLabels" -}}
app.kubernetes.io/name: {{ include "shop-console.name" . }}
app.kubernetes.io/component: mongodb
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "shop-console.postgresLabels" -}}
app.kubernetes.io/name: {{ include "shop-console.name" . }}
app.kubernetes.io/component: postgresql
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "shop-console.mongoServiceName" -}}
{{ include "shop-console.fullname" . }}-mongodb
{{- end -}}

{{- define "shop-console.postgresServiceName" -}}
{{ include "shop-console.fullname" . }}-postgres
{{- end -}}

{{- define "shop-console.mongoUrl" -}}
{{- printf "mongodb://%s:%s@%s:27017/?authSource=admin" .Values.mongo.rootUsername .Values.mongo.rootPassword (include "shop-console.mongoServiceName" .) -}}
{{- end -}}

