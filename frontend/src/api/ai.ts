import apiClient from './client'

export interface ExtractResult {
  extracted: {
    nodes: any[]
    edges: any[]
    summary: string
  }
  import_result: any
  nodes_found: number
  edges_found: number
}

export interface NLQResult {
  answer: string
  relevant_nodes: string[]
  relevant_edges: any[]
  confidence: number
  explanation: string
}

export interface AIInsights {
  key_insights: string[]
  clusters: string[]
  recommendations: string[]
  summary: string
}

export interface GraphKPIs {
  node_count: number
  edge_count: number
  orphan_count: number
  density: number
  avg_degree: number
  node_types: { type: string; count: number }[]
  relationship_types: { type: string; count: number }[]
  most_connected: {
    id: number
    label: string
    node_type: string
    color: string
    degree: number
  }[]
}

export interface PathResult {
  found: boolean
  length?: number
  path_nodes?: {
    id: number
    label: string
    node_type: string
    color: string
    external_id: string
  }[]
  path_edges?: {
    id: number
    relationship_type: string
    source_id: number
    target_id: number
  }[]
  error?: string
}

export const aiApi = {
  extract: async (
    projectId: number,
    text: string,
    autoImport = false,
    replace = false
  ): Promise<ExtractResult> => {
    const res = await apiClient.post<ExtractResult>(`/projects/${projectId}/ai/extract`, {
      text,
      auto_import: autoImport,
      replace,
    })
    return res.data
  },

  query: async (projectId: number, question: string): Promise<NLQResult> => {
    const res = await apiClient.post<NLQResult>(`/projects/${projectId}/ai/query`, {
      question,
    })
    return res.data
  },

  getInsights: async (projectId: number): Promise<AIInsights> => {
    const res = await apiClient.get<AIInsights>(`/projects/${projectId}/ai/insights`)
    return res.data
  },

  getKPIs: async (projectId: number): Promise<GraphKPIs> => {
    const res = await apiClient.get<GraphKPIs>(`/projects/${projectId}/analytics/kpis`)
    return res.data
  },

  findPath: async (projectId: number, source: string, target: string): Promise<PathResult> => {
    const res = await apiClient.get<PathResult>(`/projects/${projectId}/analytics/path`, {
      params: { source, target },
    })
    return res.data
  },
}
