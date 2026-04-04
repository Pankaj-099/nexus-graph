import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '../ui/Input'

interface FilterPanelProps {
  nodeTypes: string[]
  typeCounts: Record<string, number>
  selectedTypes: string[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onTypeToggle: (type: string) => void
  onClearFilters: () => void
  totalNodes: number
  visibleNodes: number
}

const TYPE_COLORS: Record<string, string> = {
  default: '#6366f1',
  person: '#8b5cf6',
  company: '#06b6d4',
  skill: '#10b981',
  product: '#f59e0b',
  location: '#ef4444',
  event: '#ec4899',
}

const getTypeColor = (type: string) =>
  TYPE_COLORS[type.toLowerCase()] || '#6366f1'

export const FilterPanel = ({
  nodeTypes,
  typeCounts,
  selectedTypes,
  searchQuery,
  onSearchChange,
  onTypeToggle,
  onClearFilters,
  totalNodes,
  visibleNodes,
}: FilterPanelProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const hasFilters = selectedTypes.length > 0 || searchQuery.length > 0

  return (
    <div className="absolute top-4 left-4 w-64 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl z-10 overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-indigo-400" />
          <span className="text-sm font-semibold text-white">Filters</span>
          {hasFilters && (
            <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
              {selectedTypes.length + (searchQuery ? 1 : 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-all"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <ChevronDown
              size={14}
              className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
            />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Search */}
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search size={13} />}
            rightIcon={
              searchQuery ? (
                <button onClick={() => onSearchChange('')}>
                  <X size={13} className="text-slate-400 hover:text-white" />
                </button>
              ) : null
            }
          />

          {/* Node count */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing</span>
            <span>
              <span className="text-indigo-400 font-medium">{visibleNodes}</span>
              {' '}/{' '}
              <span className="text-slate-300">{totalNodes}</span>
              {' '}nodes
            </span>
          </div>

          {/* Type filters */}
          {nodeTypes.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Node Types</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {nodeTypes.map((type) => {
                  const color = getTypeColor(type)
                  const isSelected = selectedTypes.includes(type)
                  return (
                    <button
                      key={type}
                      onClick={() => onTypeToggle(type)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                        isSelected
                          ? 'border-opacity-60 bg-opacity-20'
                          : 'border-transparent hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: color,
                              backgroundColor: `${color}15`,
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className={isSelected ? 'text-white' : 'text-slate-300'}>
                          {type}
                        </span>
                      </div>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color,
                        }}
                      >
                        {typeCounts[type] || 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
