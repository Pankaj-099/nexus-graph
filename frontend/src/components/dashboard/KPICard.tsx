import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

interface KPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  bg: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

export const KPICard = ({ label, value, icon: Icon, color, bg, subtitle }: KPICardProps) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:border-slate-700 transition-all">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
