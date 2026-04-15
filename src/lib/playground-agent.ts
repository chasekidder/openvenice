import { venice } from './venice-client'
import { NODE_SCHEMAS } from './workflow-schema'
import type { WorkflowPatch } from './workflow-mutations'
import type { ChatCompletionResponse } from '../types/venice'
import type { Node, Edge } from '@xyflow/react'
import type { VeniceNodeData } from '../stores/workflow-store'
import type { ModelCatalog } from '../hooks/use-model-catalog'

export interface AgentResponse {
  say: string
  patches: WorkflowPatch[]
}

function nodeCatalog(): string {
  return Object.values(NODE_SCHEMAS)
    .map((s) => {
      const params = s.params
        .map((p) => {
          const bits = [`${p.name}: ${p.type}${p.required ? ' (required)' : ''}`]
          if (p.default !== undefined && p.default !== '') bits.push(`default=${JSON.stringify(p.default)}`)
          if (p.enumValues) bits.push(`one of [${p.enumValues.filter(Boolean).join(', ')}]`)
          if (p.min !== undefined || p.max !== undefined) bits.push(`range ${p.min ?? '-'}..${p.max ?? '-'}`)
          return `    - ${bits.join(' — ')}`
        })
        .join('\n')
      return `- ${s.type} (${s.label}) | input=${s.input} output=${s.output}\n  ${s.description}${params ? `\n  params:\n${params}` : ''}`
    })
    .join('\n\n')
}

function modelMenu(catalog: ModelCatalog | undefined): string {
  if (!catalog) return ''
  const sections: string[] = []
  if (catalog.text.length) sections.push(`chat: ${catalog.text.join(', ')}`)
  if (catalog.image.length) sections.push(`imageGen: ${catalog.image.join(', ')}`)
  if (catalog.tts.length) sections.push(`tts: ${catalog.tts.join(', ')}`)
  if (catalog.music.length) sections.push(`music: ${catalog.music.join(', ')}`)
  if (catalog.video.length) sections.push(`video: ${catalog.video.join(', ')}`)
  if (sections.length === 0) return ''
  return `\n\nAvailable models per node type (use ONLY these ids; pick the one that best matches the user's intent or use the default if no preference):\n${sections.map((s) => `- ${s}`).join('\n')}`
}

const SYSTEM_PROMPT_BASE = `You are a workflow designer for OpenVenice. You help the user author visual workflows that chain Venice AI models.

You have these node types available:

${nodeCatalog()}

You respond by emitting patches to mutate the current draft workflow. Each patch is one of:
- {"op":"add_node","nodeType":"<type>","id":"optional_id","params":{...}} — add a new node
- {"op":"set_params","id":"<node_id>","params":{...}} — update a node's params
- {"op":"connect","source":"<node_id>","target":"<node_id>"} — connect two nodes
- {"op":"disconnect","id":"<edge_id>"} — remove an edge
- {"op":"remove_node","id":"<node_id>"} — remove a node
- {"op":"clear"} — remove all nodes and edges

RULES:
1. Every response MUST be a single valid JSON object, nothing before or after. Do not wrap in markdown fences.
2. Schema: {"say": string, "patches": Array<Patch>}.
3. "say" is a short (1–3 sentences) narration of what you just did or a question to the user.
4. When building a new workflow from scratch, start with {"op":"clear"} then add nodes top-to-bottom and connect them.
5. Always assign explicit ids when adding multiple nodes in one turn so you can reference them in connect patches.
6. Workflows need at least one textInput (or a generation node with a self-contained prompt) and an output node at the end.
7. Use {{input}} inside a node's prompt to place upstream text precisely, or leave prompt empty to append input after.
8. Keep to the param names and enum values listed above. Omit params to accept defaults.
9. If the user just asks a question, respond with a "say" and an empty "patches" array.
10. Do not narrate patches you aren't emitting. Do not produce commentary outside the JSON.

Example response:
{"say":"I built a pipeline that researches a topic, summarizes it, and narrates the summary.","patches":[{"op":"clear"},{"op":"add_node","nodeType":"textInput","id":"in","params":{"inputText":"Quantum computing progress in 2025"}},{"op":"add_node","nodeType":"chat","id":"research","params":{"prompt":"Research this topic thoroughly.","webSearch":"on"}},{"op":"add_node","nodeType":"chat","id":"summary","params":{"prompt":"Summarize into 5 bullet points.","temperature":0.3}},{"op":"add_node","nodeType":"tts","id":"narrate","params":{"voice":"af_sky"}},{"op":"add_node","nodeType":"output","id":"out"},{"op":"connect","source":"in","target":"research"},{"op":"connect","source":"research","target":"summary"},{"op":"connect","source":"summary","target":"narrate"},{"op":"connect","source":"narrate","target":"out"}]}`

function buildSystemPrompt(catalog?: ModelCatalog): string {
  return SYSTEM_PROMPT_BASE + modelMenu(catalog)
}

function describeDraft(draft: { nodes: Node<VeniceNodeData>[]; edges: Edge[] }): string {
  if (draft.nodes.length === 0) return 'Current draft is empty.'
  const nodeLines = draft.nodes.map((n) => {
    const params: string[] = []
    const data = n.data as unknown as Record<string, unknown>
    for (const p of NODE_SCHEMAS[n.data.nodeType]?.params ?? []) {
      const v = data[p.name]
      if (v !== undefined && v !== '' && v !== null) {
        const s = typeof v === 'string' ? (v.length > 60 ? v.slice(0, 60) + '…' : v) : JSON.stringify(v)
        params.push(`${p.name}=${s}`)
      }
    }
    return `  - ${n.id} [${n.data.nodeType}] ${params.join(' ')}`
  })
  const edgeLines = draft.edges.map((e) => `  - ${e.id}: ${e.source} → ${e.target}`)
  return `Current draft:\nNodes:\n${nodeLines.join('\n')}\nEdges:\n${edgeLines.join('\n') || '  (none)'}`
}

function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) return raw.slice(first, last + 1)
  return raw
}

export function parseAgentResponse(raw: string): AgentResponse {
  const json = extractJson(raw.trim())
  const parsed = JSON.parse(json) as { say?: unknown; patches?: unknown }
  const say = typeof parsed.say === 'string' ? parsed.say : ''
  const patches = Array.isArray(parsed.patches) ? (parsed.patches as WorkflowPatch[]) : []
  return { say, patches }
}

interface CallAgentOptions {
  userMessage: string
  draft: { nodes: Node<VeniceNodeData>[]; edges: Edge[] }
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  catalog?: ModelCatalog
  model?: string
  signal?: AbortSignal
}

export async function callAgent({ userMessage, draft, history, catalog, model = 'llama-3.3-70b', signal }: CallAgentOptions): Promise<AgentResponse> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(catalog) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: `${describeDraft(draft)}\n\nUser: ${userMessage}` },
  ]

  const resp = await venice<ChatCompletionResponse>('/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal,
  })

  const raw = resp.choices[0]?.message?.content ?? ''
  return parseAgentResponse(raw)
}
