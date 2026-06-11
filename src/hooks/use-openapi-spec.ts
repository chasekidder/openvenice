import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import yaml from 'js-yaml'

export interface OpenAPISchemaEntry {
  name: string
  type: 'boolean' | 'string' | 'number' | 'integer'
  description?: string
  default?: unknown
  enum?: string[]
  minimum?: number
  maximum?: number
  required?: boolean
}

function parseSchemaProperty(name: string, prop: Record<string, unknown>): OpenAPISchemaEntry {
  const entry: OpenAPISchemaEntry = { name, type: 'string' }
  if (typeof prop.type === 'string') {
    entry.type = prop.type as OpenAPISchemaEntry['type']
  } else if (prop.anyOf || prop.oneOf) {
    entry.type = 'string'
  }
  if (typeof prop.description === 'string') {
    entry.description = prop.description
  }
  if (prop.default !== undefined) {
    entry.default = prop.default
  }
  if (Array.isArray(prop.enum)) {
    entry.enum = prop.enum.map(String)
  }
  if (typeof prop.minimum === 'number') entry.minimum = prop.minimum
  if (typeof prop.maximum === 'number') entry.maximum = prop.maximum
  return entry
}

function findRequestBodySchema(spec: Record<string, unknown>, apiPath: string): Record<string, unknown> | null {
  const paths = spec.paths as Record<string, unknown> | undefined
  if (!paths) return null
  const pathEntry = paths[apiPath] as Record<string, unknown> | undefined
  if (!pathEntry) return null
  const post = (pathEntry.POST ?? pathEntry.post) as Record<string, unknown> | undefined
  if (!post) return null
  const reqBody = post.requestBody as Record<string, unknown> | undefined
  if (!reqBody) return null
  const content = reqBody.content as Record<string, unknown> | undefined
  if (!content) return null
  const json = content['application/json'] as Record<string, unknown> | undefined
  if (!json) return null
  const schema = json.schema as Record<string, unknown> | undefined
  if (!schema) return null
  if (typeof schema.$ref === 'string') {
    const refPath = schema.$ref.replace('#/', '').split('/')
    let ref: Record<string, unknown> = spec as Record<string, unknown>
    for (const seg of refPath) {
      if (ref && typeof ref === 'object') ref = ref[seg] as Record<string, unknown>
    }
    return ref || null
  }
  return schema
}

export function useOpenapiSpec() {
  return useQuery({
    queryKey: ['openapi-spec'],
    queryFn: async () => {
      try {
        const res = await fetch('/venice/doc/api/swagger.yaml', { signal: AbortSignal.timeout(10000) })
        if (!res.ok) return null
        const text = await res.text()
        return yaml.load(text) as Record<string, unknown>
      } catch {
        return null
      }
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function useEndpointSchema(apiPath: string, primaryFields: string[]) {
  const { data: spec, isError, error } = useOpenapiSpec()

  return useMemo(() => {
    if (isError) return { entries: [] as OpenAPISchemaEntry[], isLoading: false, error: error as Error }
    if (!spec) return { entries: [] as OpenAPISchemaEntry[], isLoading: true }

    const schema = findRequestBodySchema(spec, apiPath)
    if (!schema) return { entries: [], isLoading: false }

    const props = schema.properties as Record<string, unknown> | undefined
    if (!props) return { entries: [], isLoading: false }

    const required = Array.isArray(schema.required) ? new Set(schema.required as string[]) : new Set<string>()
    const primary = new Set(primaryFields)

    const entries: OpenAPISchemaEntry[] = []
    for (const [name, prop] of Object.entries(props)) {
      if (primary.has(name)) continue
      if (name === 'model') continue
      entries.push({
        ...parseSchemaProperty(name, prop as Record<string, unknown>),
        required: required.has(name),
      })
    }

    entries.sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return { entries, isLoading: false }
  }, [spec, apiPath, primaryFields, isError, error])
}