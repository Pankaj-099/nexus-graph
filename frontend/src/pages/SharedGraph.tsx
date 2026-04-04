import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactFlow, {
  type Node, type Edge, Background, MiniMap,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, BackgroundVariant, MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { GitBranch, Network, ExternalLink, Lock } from 'lucide-react'
import { publicApi } from '../api/activity'
import { CustomNode } from '../components/graph/CustomNode'
import { Loader } from '../components/ui/Loader'

const RF_NODE_TYPES = { custom: CustomNode }

const TYPE_COLORS: Record<string, string> = {
  default: '#6366f1', person: '#8b5cf6', company: '#06b6d4',
  skill: '#10b981', product: '#f59e0b', location: '#ef4444',
  event: '#ec4899', technology: '#14b8a6',
}
const getColor = (type: string, color?: string | null) =>
  color || TYPE_COLORS[type?.toLowerCase()] || '#6366f1'

function SharedGraphInner() {
  const { token } = useParams<{ token: string }>()
  const { fitView } = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) return
    loadGraph()
  }, [token])

  const loadGraph = async () => {
    try {
      const data = await publicApi.getPublicGraph(token!)
      setProject(data.project)

      const cols = Math.max(1, Math.ceil(Math.sqrt(data.nodes.length)))
      const rfNodes: Node[] = data.nodes.map((n: any, i: number) => ({
        id: String(n.id),
        type: 'custom',
        position: {
          x: n.position_x !== 0 ? n.position_x : (i % cols - cols / 2) * 220,
          y: n.position_y !== 0 ? n.position_y : Math.floor(i / cols) * 200,
        },
        data: {
          label: n.label,
          node_type: n.node_type,
          color: getColor(n.node_type, n.color),
          size: 48,
          properties: n.properties || {},
          isDimmed: false,
        },
      }))

      const rfEdges: Edge[] = data.edges.map((e: any) => ({
        id: String(e.id),
        source: String(e.source_id),
        target: String(e.target_id),
        label: e.relationship_type,
        type: 'smoothstep',
        style: { stroke: '#47556980', strokeWidth: 2 },
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
        labelBgPadding: [4, 6] as [number, number],
        markerEnd: e.is_directed
          ? { type: MarkerType.ArrowClosed, color: '#475569', width: 16, height: 16 }
          : undefined,
      }))

      setNodes(rfNodes)
      setEdges(rfEdges)
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 150)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader fullScreen text="Loading shared graph..." />

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Graph Not Found</h2>
          <p className="text-slate-400 text-sm">This graph doesn't exist or is no longer public.</p>
          <a href="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
            Go to RIP →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-slate-950 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
            <GitBranch size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{project?.name}</p>
            {project?.description && (
              <p className="text-slate-400 text-xs">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Network size={12} className="text-indigo-400" />
              {project?.node_count} nodes
            </span>
            <span className="flex items-center gap-1">
              <GitBranch size={12} className="text-violet-400" />
              {project?.edge_count} edges
            </span>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg px-3 py-1.5 hover:border-slate-600"
          >
            <ExternalLink size={12} />
            Open in RIP
          </a>
        </div>
      </div>

      <div className="w-full h-full pt-14">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={RF_NODE_TYPES}
          fitView
          minZoom={0.05}
          maxZoom={3}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#1e293b" />
          <MiniMap
            className="!bg-slate-900 !border !border-slate-700 !rounded-xl"
            nodeColor={(n) => n.data?.color || '#6366f1'}
            maskColor="rgba(15,23,42,0.75)"
            style={{ bottom: 24, right: 16 }}
          />
        </ReactFlow>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-slate-600">
        <GitBranch size={12} />
        <span>Powered by Relationship Intelligence Platform</span>
      </div>
    </div>
  )
}

export const SharedGraph = () => (
  <ReactFlowProvider>
    <SharedGraphInner />
  </ReactFlowProvider>
)
