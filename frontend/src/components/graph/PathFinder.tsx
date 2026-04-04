import { useState } from 'react'
import { GitBranch, Search, X, ChevronRight } from 'lucide-react'
import { aiApi, PathResult } from '../../api/ai'
import { GraphNode } from '../../api/graph'
import { Button } from '../ui/Button'
import { Loader } from '../ui/Loader'
import toast from 'react-hot-toast'

interface PathFinderProps {
  projectId: number
  nodes: GraphNode[]
  onHighlightPath: (nodeIds: number[], edgeIds: number[]) => void
  onClose: () => void
}

export const PathFinder = ({ projectId, nodes, onHighlightPath, onClose }: PathFinderProps) => {
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [result, setResult] = useState<PathResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFind = async () => {
    if (!source || !target) return toast.error('Select both nodes')
    if (source === target) return toast.error('Source and target must be different')
    setLoading(true)
    try {
      const res = await aiApi.findPath(projectId, source, target)
      setResult(res)
      if (res.found && res.path_nodes && res.path_edges) {
        onHighlightPath(
          res.path_nodes.map((n) => n.id),
          res.path_edges.map((e) => e.id)
        )
        toast.success(`Path found! Length: ${res.length} hops`)
      } else {
        toast.error(res.error || 'No path found')
      }
    } catch {
      toast.error('Path finding failed')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle = "w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"

  return (
    <div className="absolute top-16 right-4 w-72 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl z-10 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-white">Path Finder</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">From</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectStyle}>
            <option value="">Select source...</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.external_id}>{n.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">To</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={selectStyle}>
            <option value="">Select target...</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.external_id}>{n.label}</option>
            ))}
          </select>
        </div>

        <Button className="w-full" size="sm" onClick={handleFind} isLoading={loading}>
          <Search size={13} />
          Find Shortest Path
        </Button>

        {result && result.found && result.path_nodes && (
          <div className="mt-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">
              Path found · <span className="text-indigo-400 font-medium">{result.length} hops</span>
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {result.path_nodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${node.color || '#6366f1'}20`,
                      color: node.color || '#6366f1',
                      border: `1px solid ${node.color || '#6366f1'}40`,
                    }}
                  >
                    {node.label}
                  </span>
                  {i < result.path_nodes!.length - 1 && (
                    <ChevronRight size={12} className="text-slate-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !result.found && (
          <div className="mt-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <p className="text-xs text-red-400">{result.error || 'No path exists'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
