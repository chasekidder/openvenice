import type { Node, Edge } from '@xyflow/react'
import type { VeniceNodeData, VeniceNodeType } from '../stores/workflow-store'
import { NODE_SCHEMAS } from './workflow-schema'
import { generateId } from './utils'

export type WorkflowPatch =
  | { op: 'add_node'; nodeType: VeniceNodeType; id?: string; position?: { x: number; y: number }; params?: Partial<VeniceNodeData> }
  | { op: 'remove_node'; id: string }
  | { op: 'set_params'; id: string; params: Partial<VeniceNodeData> }
  | { op: 'move_node'; id: string; position: { x: number; y: number } }
  | { op: 'connect'; source: string; target: string; id?: string }
  | { op: 'disconnect'; id: string }
  | { op: 'clear' }

export interface PatchResult {
  nodes: Node<VeniceNodeData>[]
  edges: Edge[]
  addedNodeId?: string
  addedEdgeId?: string
}

type WFGraph = { nodes: Node<VeniceNodeData>[]; edges: Edge[] }

function defaultDataFor(nodeType: VeniceNodeType): VeniceNodeData {
  const schema = NODE_SCHEMAS[nodeType]
  const data: VeniceNodeData = {
    label: schema?.label ?? nodeType,
    nodeType,
    model: '',
    prompt: '',
  }
  for (const p of schema?.params ?? []) {
    if (p.default !== undefined) {
      (data as unknown as Record<string, unknown>)[p.name] = p.default
    }
  }
  return data
}

function autoPosition(existing: Node<VeniceNodeData>[]): { x: number; y: number } {
  const count = existing.length
  return { x: 250 + (count % 3) * 60, y: 100 + count * 180 }
}

export function applyPatch(graph: WFGraph, patch: WorkflowPatch): PatchResult {
  const { nodes, edges } = graph

  switch (patch.op) {
    case 'add_node': {
      if (!NODE_SCHEMAS[patch.nodeType]) {
        throw new Error(`Unknown node type: ${patch.nodeType}`)
      }
      const id = patch.id ?? generateId()
      if (nodes.some((n) => n.id === id)) throw new Error(`Node id already exists: ${id}`)
      const position = patch.position ?? autoPosition(nodes)
      const data: VeniceNodeData = { ...defaultDataFor(patch.nodeType), ...(patch.params ?? {}) }
      const node: Node<VeniceNodeData> = { id, type: 'venice', position, data }
      return { nodes: [...nodes, node], edges, addedNodeId: id }
    }

    case 'remove_node': {
      if (!nodes.some((n) => n.id === patch.id)) throw new Error(`Node not found: ${patch.id}`)
      return {
        nodes: nodes.filter((n) => n.id !== patch.id),
        edges: edges.filter((e) => e.source !== patch.id && e.target !== patch.id),
      }
    }

    case 'set_params': {
      if (!nodes.some((n) => n.id === patch.id)) throw new Error(`Node not found: ${patch.id}`)
      return {
        nodes: nodes.map((n) => (n.id === patch.id ? { ...n, data: { ...n.data, ...patch.params } } : n)),
        edges,
      }
    }

    case 'move_node': {
      if (!nodes.some((n) => n.id === patch.id)) throw new Error(`Node not found: ${patch.id}`)
      return {
        nodes: nodes.map((n) => (n.id === patch.id ? { ...n, position: patch.position } : n)),
        edges,
      }
    }

    case 'connect': {
      if (!nodes.some((n) => n.id === patch.source)) throw new Error(`Source node not found: ${patch.source}`)
      if (!nodes.some((n) => n.id === patch.target)) throw new Error(`Target node not found: ${patch.target}`)
      if (patch.source === patch.target) throw new Error('Cannot connect a node to itself.')
      const id = patch.id ?? `e-${patch.source}-${patch.target}-${generateId().slice(0, 6)}`
      if (edges.some((e) => e.id === id)) throw new Error(`Edge id already exists: ${id}`)
      const edge: Edge = { id, source: patch.source, target: patch.target, animated: true }
      return { nodes, edges: [...edges, edge], addedEdgeId: id }
    }

    case 'disconnect': {
      if (!edges.some((e) => e.id === patch.id)) throw new Error(`Edge not found: ${patch.id}`)
      return { nodes, edges: edges.filter((e) => e.id !== patch.id) }
    }

    case 'clear': {
      return { nodes: [], edges: [] }
    }
  }
}

export function applyPatches(graph: WFGraph, patches: readonly WorkflowPatch[]): PatchResult {
  let current: WFGraph = graph
  let lastAddedNodeId: string | undefined
  let lastAddedEdgeId: string | undefined
  for (const p of patches) {
    const r = applyPatch(current, p)
    current = { nodes: r.nodes, edges: r.edges }
    if (r.addedNodeId) lastAddedNodeId = r.addedNodeId
    if (r.addedEdgeId) lastAddedEdgeId = r.addedEdgeId
  }
  return { nodes: current.nodes, edges: current.edges, addedNodeId: lastAddedNodeId, addedEdgeId: lastAddedEdgeId }
}
