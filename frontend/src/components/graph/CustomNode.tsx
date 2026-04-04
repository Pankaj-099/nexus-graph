import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

interface CustomNodeData {
  label: string
  node_type: string
  color: string
  size: number
  properties: Record<string, any>
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
}

export const CustomNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const color = data.color || '#6366f1'
  const isDimmed = data.isDimmed && !selected

  return (
    <div
      className="relative flex flex-col items-center group"
      style={{ opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border-2 !border-slate-900"
        style={{ backgroundColor: color }}
      />

      {/* Node circle */}
      <div
        className="flex items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200 cursor-pointer"
        style={{
          width: Math.max(data.size || 40, 36),
          height: Math.max(data.size || 40, 36),
          backgroundColor: `${color}25`,
          borderColor: selected ? '#ffffff' : color,
          boxShadow: selected
            ? `0 0 0 3px ${color}60, 0 4px 20px ${color}40`
            : `0 4px 12px ${color}30`,
        }}
      >
        <span
          className="font-bold text-white select-none"
          style={{ fontSize: Math.max((data.size || 40) / 3.5, 10) }}
        >
          {data.label?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>

      {/* Label */}
      <div
        className="mt-1.5 px-2 py-0.5 rounded-md text-center max-w-32"
        style={{
          backgroundColor: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <p className="text-xs font-medium text-white truncate leading-tight">
          {data.label}
        </p>
        <p className="text-xs truncate leading-tight" style={{ color: `${color}cc` }}>
          {data.node_type}
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-2 !border-slate-900"
        style={{ backgroundColor: color }}
      />
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
