import apiClient from './client'
import type { GraphNode, GraphEdge } from './graph'

export interface SearchResponse {
  nodes: GraphNode[]
  total: number
  query: string
}

export interface NodeTypesResponse {
  types: string[]
  counts: Record<string, number>
}

export interface NeighborsResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  center_node_id: number
  depth: number
}

export const searchApi = {
  searchNodes: async (
    projectId: number,
    params: { q?: string; node_type?: string; limit?: number; offset?: number }
  ): Promise<SearchResponse> => {
    const res = await apiClient.get<SearchResponse>(`/projects/${projectId}/search`, { params })
    return res.data
  },

  getNodeTypes: async (projectId: number): Promise<NodeTypesResponse> => {
    const res = await apiClient.get<NodeTypesResponse>(`/projects/${projectId}/search/types`)
    return res.data
  },

  getNeighbors: async (projectId: number, nodeId: number, depth = 1): Promise<NeighborsResponse> => {
    const res = await apiClient.get<NeighborsResponse>(
      `/projects/${projectId}/search/neighbors/${nodeId}`,
      { params: { depth } }
    )
    return res.data
  },
}
