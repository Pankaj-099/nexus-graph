import { X, Network, Link, Trash2 } from 'lucide-react'
import type { GraphNode, GraphEdge } from '../../api/graph'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface NodePanelProps {
  node: GraphNode | null
  edges: GraphEdge[]
  allNodes: GraphNode[]
  onClose: () => void
  onDelete: (nodeId: number) => void
  onFocusNeighbors: (nodeId: number) => void
}

export const NodePanel = ({
  node,
  edges,
  allNodes,
  onClose,
  onDelete,
  onFocusNeighbors,
}: NodePanelProps) => {
  if (!node) return null

  const connectedEdges = edges.filter(
    (e) => e.source_id === node.id || e.target_id === node.id
  )

  const getNodeLabel = (id: number) =>
    allNodes.find((n) => n.id === id)?.label || String(id)

  const color = node.color || '#6366f1'

  return (
    <div className="absolute top-4 right-4 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-10 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: `${color}30`, border: `2px solid ${color}` }}
          >
            {node.label.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{node.label}</p>
            <Badge label={node.node_type} color={color} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* ID */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Node ID</p>
          <p className="text-sm text-slate-300 font-mono bg-slate-800 px-2 py-1 rounded">
            {node.external_id}
          </p>
        </div>

        {/* Properties */}
        {Object.keys(node.properties || {}).length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Properties</p>
            <div className="space-y-1.5">
              {Object.entries(node.properties).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 text-xs">
                  <span className="text-indigo-400 font-medium min-w-16 flex-shrink-0">{k}</span>
                  <span className="text-slate-300 break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        <div>
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <Link size={11} />
            Connections ({connectedEdges.length})
          </p>
          {connectedEdges.length === 0 ? (
            <p className="text-xs text-slate-600">No connections</p>
          ) : (
            <div className="space-y-1.5">
              {connectedEdges.slice(0, 8).map((edge) => {
                const isSource = edge.source_id === node.id
                const otherId = isSource ? edge.target_id : edge.source_id
                return (
                  <div
                    key={edge.id}
                    className="flex items-center gap-2 text-xs bg-slate-800/60 rounded-lg px-2 py-1.5"
                  >
                    <span className="text-slate-500">{isSource ? '→' : '←'}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {edge.relationship_type}
                    </span>
                    <span className="text-slate-300 truncate">{getNodeLabel(otherId)}</span>
                  </div>
                )
              })}
              {connectedEdges.length > 8 && (
                <p className="text-xs text-slate-500">+{connectedEdges.length - 8} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-slate-800 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => onFocusNeighbors(node.id)}
        >
          <Network size={13} />
          Expand
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}
