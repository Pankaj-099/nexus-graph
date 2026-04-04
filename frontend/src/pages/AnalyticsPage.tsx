import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Network, GitBranch, Zap, Target,
  Brain, Lightbulb, Search, TrendingUp, AlertCircle,
  BarChart3, Layers, RefreshCw, MessageSquare, Send
} from 'lucide-react'
import { aiApi } from '../api/ai'
import type { GraphKPIs, AIInsights, NLQResult } from '../api/ai'
import { graphApi } from '../api/graph'
import { projectsApi } from '../api/projects'
import { KPICard } from '../components/dashboard/KPICard'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import toast from 'react-hot-toast'

const TYPE_COLORS: Record<string, string> = {
  default: '#6366f1', person: '#8b5cf6', company: '#06b6d4',
  skill: '#10b981', product: '#f59e0b', location: '#ef4444',
  event: '#ec4899', technology: '#14b8a6',
}
const getColor = (type: string) => TYPE_COLORS[type?.toLowerCase()] || '#6366f1'

export const AnalyticsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [projectName, setProjectName] = useState('')
  const [kpis, setKpis] = useState<GraphKPIs | null>(null)
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loadingKpis, setLoadingKpis] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [nodes, setNodes] = useState<any[]>([])

  // NLQ state
  const [question, setQuestion] = useState('')
  const [nlqResult, setNlqResult] = useState<NLQResult | null>(null)
  const [nlqLoading, setNlqLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ q: string; a: NLQResult }[]>([])

  // AI Extract state
  const [extractText, setExtractText] = useState('')
  const [extractLoading, setExtractLoading] = useState(false)
  const [extractResult, setExtractResult] = useState<any>(null)
  const [autoImport, setAutoImport] = useState(true)

  // Path finder state
  const [pathSource, setPathSource] = useState('')
  const [pathTarget, setPathTarget] = useState('')
  const [pathResult, setPathResult] = useState<any>(null)
  const [pathLoading, setPathLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoadingKpis(true)
    try {
      const [proj, kpiData, graphData] = await Promise.all([
        projectsApi.get(projectId),
        aiApi.getKPIs(projectId),
        graphApi.getGraph(projectId, { limit: 500 }),
      ])
      setProjectName(proj.name)
      setKpis(kpiData)
      setNodes(graphData.nodes)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoadingKpis(false)
    }
  }

  const loadInsights = async () => {
    setLoadingInsights(true)
    try {
      const data = await aiApi.getInsights(projectId)
      setInsights(data)
    } catch {
      toast.error('Failed to get AI insights. Check your OpenAI API key.')
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleNLQ = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return
    setNlqLoading(true)
    try {
      const result = await aiApi.query(projectId, question)
      setNlqResult(result)
      setChatHistory((prev) => [...prev, { q: question, a: result }])
      setQuestion('')
    } catch {
      toast.error('Query failed. Check your OpenAI API key.')
    } finally {
      setNlqLoading(false)
    }
  }

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!extractText.trim()) return
    setExtractLoading(true)
    try {
      const result = await aiApi.extract(projectId, extractText, autoImport)
      setExtractResult(result)
      if (autoImport && result.import_result) {
        toast.success(`Extracted & imported ${result.nodes_found} nodes, ${result.edges_found} edges!`)
        await loadData()
      } else {
        toast.success(`Extracted ${result.nodes_found} nodes, ${result.edges_found} edges!`)
      }
    } catch {
      toast.error('Extraction failed. Check your OpenAI API key.')
    } finally {
      setExtractLoading(false)
    }
  }

  const handleFindPath = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pathSource || !pathTarget) return toast.error('Select both nodes')
    setPathLoading(true)
    try {
      const result = await aiApi.findPath(projectId, pathSource, pathTarget)
      setPathResult(result)
      if (result.found) {
        toast.success(`Path found! ${result.length} hops`)
      } else {
        toast.error(result.error || 'No path found')
      }
    } catch {
      toast.error('Path finding failed')
    } finally {
      setPathLoading(false)
    }
  }

  if (loadingKpis) return <Loader fullScreen text="Loading analytics..." />

  const selectStyle = "w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <BarChart3 size={16} className="text-indigo-400" />
            <span className="font-semibold text-white">{projectName}</span>
            <span className="text-slate-500 text-sm">Analytics & AI</span>
          </div>
          <Button size="sm" variant="secondary" onClick={loadData}>
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={() => navigate(`/projects/${projectId}/graph`)}>
            <Network size={13} /> View Graph
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* KPI Grid */}
        {kpis && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              Graph KPIs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <KPICard label="Total Nodes" value={kpis.node_count} icon={Network} color="text-indigo-400" bg="bg-indigo-500/10" />
              <KPICard label="Total Edges" value={kpis.edge_count} icon={GitBranch} color="text-violet-400" bg="bg-violet-500/10" />
              <KPICard label="Orphan Nodes" value={kpis.orphan_count} icon={AlertCircle} color="text-amber-400" bg="bg-amber-500/10" subtitle="No connections" />
              <KPICard label="Avg Degree" value={kpis.avg_degree} icon={Zap} color="text-sky-400" bg="bg-sky-500/10" subtitle="Connections per node" />
              <KPICard label="Graph Density" value={`${(kpis.density * 100).toFixed(2)}%`} icon={Layers} color="text-emerald-400" bg="bg-emerald-500/10" subtitle="Edge coverage" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Node types */}
              <Card>
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Network size={14} className="text-indigo-400" /> Node Types
                </h3>
                <div className="space-y-2">
                  {kpis.node_types.length === 0 ? (
                    <p className="text-slate-500 text-xs">No data</p>
                  ) : kpis.node_types.map((t) => (
                    <div key={t.type} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(t.type) }} />
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(t.count / kpis.node_count) * 100}%`,
                            backgroundColor: getColor(t.type),
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-300 w-16 text-right">{t.type} ({t.count})</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Relationship types */}
              <Card>
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <GitBranch size={14} className="text-violet-400" /> Relationship Types
                </h3>
                <div className="space-y-2">
                  {kpis.relationship_types.length === 0 ? (
                    <p className="text-slate-500 text-xs">No data</p>
                  ) : kpis.relationship_types.slice(0, 6).map((t) => (
                    <div key={t.type} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-32">{t.type}</span>
                      <span className="text-violet-400 font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Most connected */}
              <Card>
                <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <Target size={14} className="text-emerald-400" /> Most Connected
                </h3>
                <div className="space-y-2">
                  {kpis.most_connected.length === 0 ? (
                    <p className="text-slate-500 text-xs">No data</p>
                  ) : kpis.most_connected.slice(0, 6).map((n, i) => (
                    <div key={n.id} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 w-4">{i + 1}.</span>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: n.color || getColor(n.node_type) }} />
                      <span className="text-slate-300 truncate flex-1">{n.label}</span>
                      <span className="text-emerald-400 font-medium">{n.degree}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Relationship Extraction */}
          <Card>
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Brain size={16} className="text-violet-400" />
              AI Relationship Extraction
            </h3>
            <p className="text-slate-400 text-xs mb-4">Paste any text — AI extracts nodes and relationships automatically</p>
            <form onSubmit={handleExtract} className="space-y-3">
              <textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                placeholder="Paste a bio, article, job description, or any text..."
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none"
                rows={5}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoImport}
                    onChange={(e) => setAutoImport(e.target.checked)}
                    className="w-4 h-4 rounded accent-violet-500"
                  />
                  <span className="text-sm text-slate-300">Auto-import to graph</span>
                </label>
                <Button type="submit" size="sm" isLoading={extractLoading}>
                  <Brain size={13} /> Extract
                </Button>
              </div>
            </form>

            {extractResult && (
              <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                <p className="text-xs font-medium text-white">{extractResult.extracted?.summary}</p>
                <div className="flex gap-3 text-xs">
                  <span className="text-indigo-400">{extractResult.nodes_found} nodes</span>
                  <span className="text-violet-400">{extractResult.edges_found} relationships</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {extractResult.extracted?.nodes?.slice(0, 8).map((n: any, i: number) => (
                    <Badge key={i} label={n.label} color={getColor(n.type)} />
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Natural Language Query */}
          <Card>
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <MessageSquare size={16} className="text-sky-400" />
              Natural Language Query
            </h3>
            <p className="text-slate-400 text-xs mb-4">Ask anything about your graph in plain English</p>

            {/* Chat history */}
            <div className="space-y-3 max-h-52 overflow-y-auto mb-3 pr-1">
              {chatHistory.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-xs">Try: "Who knows React?" or "What's the most connected node?"</p>
                </div>
              ) : (
                chatHistory.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-indigo-600/20 border border-indigo-500/20 rounded-xl rounded-tr-sm px-3 py-2 max-w-xs">
                        <p className="text-xs text-indigo-200">{item.q}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-tl-sm px-3 py-2 max-w-xs">
                        <p className="text-xs text-slate-200">{item.a.answer}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Confidence: {Math.round(item.a.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleNLQ} className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your graph..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
              <Button type="submit" size="sm" isLoading={nlqLoading}>
                <Send size={13} />
              </Button>
            </form>
          </Card>

          {/* Path Finder */}
          <Card>
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Search size={16} className="text-emerald-400" />
              Path Finder
            </h3>
            <p className="text-slate-400 text-xs mb-4">Find shortest path between any two nodes</p>
            <form onSubmit={handleFindPath} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">From</label>
                <select value={pathSource} onChange={(e) => setPathSource(e.target.value)} className={selectStyle}>
                  <option value="">Select source node...</option>
                  {nodes.map((n) => <option key={n.id} value={n.external_id}>{n.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">To</label>
                <select value={pathTarget} onChange={(e) => setPathTarget(e.target.value)} className={selectStyle}>
                  <option value="">Select target node...</option>
                  {nodes.map((n) => <option key={n.id} value={n.external_id}>{n.label}</option>)}
                </select>
              </div>
              <Button type="submit" size="sm" className="w-full" isLoading={pathLoading}>
                <Search size={13} /> Find Shortest Path
              </Button>
            </form>

            {pathResult && (
              <div className="mt-3">
                {pathResult.found ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-400 font-medium mb-2">
                      Path found · {pathResult.length} hops
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {pathResult.path_nodes?.map((node: any, i: number) => (
                        <div key={node.id} className="flex items-center gap-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${node.color || '#6366f1'}20`, color: node.color || '#6366f1', border: `1px solid ${node.color || '#6366f1'}40` }}
                          >
                            {node.label}
                          </span>
                          {i < pathResult.path_nodes.length - 1 && (
                            <span className="text-slate-500 text-xs">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400">{pathResult.error || 'No path found'}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* AI Insights */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-400" />
                  AI Graph Insights
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">AI-powered analysis of your graph structure</p>
              </div>
              <Button size="sm" variant="secondary" onClick={loadInsights} isLoading={loadingInsights}>
                <Brain size={13} /> Analyze
              </Button>
            </div>

            {!insights ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Lightbulb size={24} className="text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">Click "Analyze" to get AI insights</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Summary</p>
                  <p className="text-sm text-slate-200 leading-relaxed">{insights.summary}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2">Key Insights</p>
                  <ul className="space-y-1.5">
                    {insights.key_insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                {insights.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">Recommendations</p>
                    <ul className="space-y-1.5">
                      {insights.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
