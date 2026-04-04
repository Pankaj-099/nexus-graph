import apiClient from './client'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface ActivityLog {
  id: number
  action: string
  entity_type: string | null
  entity_id: number | null
  project_id: number | null
  log_metadata: Record<string, any>
  created_at: string
}

export interface PublicGraph {
  project: {
    id: number
    name: string
    description: string | null
    color: string
    node_count: number
    edge_count: number
    created_at: string
  }
  nodes: any[]
  edges: any[]
}

export const activityApi = {
  getMyActivity: async (limit = 50): Promise<ActivityLog[]> => {
    const res = await apiClient.get<ActivityLog[]>('/activity/me', { params: { limit } })
    return res.data
  },

  getProjectActivity: async (projectId: number, limit = 50): Promise<ActivityLog[]> => {
    const res = await apiClient.get<ActivityLog[]>(`/activity/projects/${projectId}`, { params: { limit } })
    return res.data
  },
}

export const publicApi = {
  getPublicGraph: async (shareToken: string): Promise<PublicGraph> => {
    const res = await axios.get<PublicGraph>(`${API_URL}/api/public/${shareToken}`)
    return res.data
  },
}
