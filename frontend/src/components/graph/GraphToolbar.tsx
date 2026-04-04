import { ZoomIn, ZoomOut, Maximize, Grid, Download } from 'lucide-react'
import { useReactFlow } from 'reactflow'

interface GraphToolbarProps {
  onFitView: () => void
  onExport: () => void
  showGrid: boolean
  onToggleGrid: () => void
  nodeCount: number
  edgeCount: number
}

export const GraphToolbar = ({
  onFitView,
  onExport,
  showGrid,
  onToggleGrid,
  nodeCount,
  edgeCount,
}: GraphToolbarProps) => {
  const { zoomIn, zoomOut } = useReactFlow()

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-md">
      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-slate-400 pr-3 border-r border-slate-700">
        <span><span className="text-indigo-400 font-medium">{nodeCount}</span> nodes</span>
        <span><span className="text-violet-400 font-medium">{edgeCount}</span> edges</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 pl-1">
        {[
          { icon: ZoomIn, onClick: () => zoomIn(), title: 'Zoom In' },
          { icon: ZoomOut, onClick: () => zoomOut(), title: 'Zoom Out' },
          { icon: Maximize, onClick: onFitView, title: 'Fit View' },
          { icon: Grid, onClick: onToggleGrid, title: 'Toggle Grid', active: showGrid },
          { icon: Download, onClick: onExport, title: 'Export' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            title={btn.title}
            className={`p-2 rounded-xl transition-all ${
              btn.active
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <btn.icon size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}
