import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Code, Copy, Check, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface CodeBlockProps {
  code: string
  language?: string
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-slate-800 rounded-lg hover:bg-slate-700"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
      </button>
    </div>
  )
}

export const ApiDocsPage = () => {
  const navigate = useNavigate()
  const { accessToken } = useAuthStore()
  const token = accessToken || 'YOUR_TOKEN_HERE'

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/projects',
      desc: 'List all your projects',
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      code: `curl -H "Authorization: Bearer ${token}" \\
  ${API_URL}/api/v1/projects`,
    },
    {
      method: 'GET',
      path: '/api/v1/projects/{id}/graph',
      desc: 'Get all nodes and edges of a project',
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      code: `curl -H "Authorization: Bearer ${token}" \\
  ${API_URL}/api/v1/projects/1/graph`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/nodes',
      desc: 'Add a new node to a project',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      code: `curl -X POST \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"external_id":"node1","label":"Alice","node_type":"Person"}' \\
  ${API_URL}/api/v1/projects/1/nodes`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/edges',
      desc: 'Add an edge between two nodes',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      code: `curl -X POST \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"source_external_id":"node1","target_external_id":"node2","relationship_type":"KNOWS"}' \\
  ${API_URL}/api/v1/projects/1/edges`,
    },
    {
      method: 'POST',
      path: '/api/v1/projects/{id}/import',
      desc: 'Bulk import nodes and edges',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      code: `curl -X POST \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"nodes":[{"external_id":"a","label":"Alice","node_type":"Person"}],"edges":[]}' \\
  ${API_URL}/api/v1/projects/1/import`,
    },
    {
      method: 'DELETE',
      path: '/api/v1/projects/{id}/nodes/{external_id}',
      desc: 'Delete a node by its external ID',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      code: `curl -X DELETE \\
  -H "Authorization: Bearer ${token}" \\
  ${API_URL}/api/v1/projects/1/nodes/node1`,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Code size={16} className="text-indigo-400" />
            <span className="font-semibold text-white">External API Docs</span>
          </div>
          <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary">
              <ExternalLink size={13} /> Swagger UI
            </Button>
          </a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Intro */}
        <Card>
          <h2 className="font-bold text-white text-lg mb-2">REST API for External Use</h2>
          <p className="text-slate-400 text-sm mb-4">
            Use your Bearer token to integrate RIP into your own applications, scripts, or workflows.
          </p>
          <div>
            <p className="text-xs text-slate-500 mb-2">Base URL</p>
            <CodeBlock code={`${API_URL}/api/v1`} />
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-2">Authentication — add this header to all requests:</p>
            <CodeBlock code={`Authorization: Bearer ${token}`} />
          </div>
        </Card>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Code size={16} className="text-indigo-400" />
            Endpoints
          </h2>
          {endpoints.map((ep, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${ep.color}`}>
                  {ep.method}
                </span>
                <div>
                  <p className="text-sm font-mono text-white">{ep.path}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{ep.desc}</p>
                </div>
              </div>
              <CodeBlock code={ep.code} />
            </Card>
          ))}
        </div>

        {/* Python example */}
        <Card>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Code size={14} className="text-violet-400" /> Python Example
          </h3>
          <CodeBlock code={`import requests

TOKEN = "${token}"
PROJECT_ID = 1
BASE = "${API_URL}/api/v1"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# Get all projects
projects = requests.get(f"{BASE}/projects", headers=HEADERS).json()
print(projects)

# Add a node
node = requests.post(
    f"{BASE}/projects/{PROJECT_ID}/nodes",
    headers=HEADERS,
    json={"external_id": "alice", "label": "Alice", "node_type": "Person"}
).json()
print(node)

# Get graph data
graph = requests.get(f"{BASE}/projects/{PROJECT_ID}/graph", headers=HEADERS).json()
print(f"Nodes: {graph['meta']['node_count']}")`} />
        </Card>

        {/* JavaScript example */}
        <Card>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Code size={14} className="text-amber-400" /> JavaScript Example
          </h3>
          <CodeBlock code={`const TOKEN = "${token}";
const PROJECT_ID = 1;
const BASE = "${API_URL}/api/v1";

const headers = {
  "Authorization": \`Bearer \${TOKEN}\`,
  "Content-Type": "application/json"
};

// Get graph
const graph = await fetch(\`\${BASE}/projects/\${PROJECT_ID}/graph\`, { headers })
  .then(r => r.json());
console.log(graph);

// Add node
const node = await fetch(\`\${BASE}/projects/\${PROJECT_ID}/nodes\`, {
  method: "POST",
  headers,
  body: JSON.stringify({ external_id: "bob", label: "Bob", node_type: "Person" })
}).then(r => r.json());
console.log(node);`} />
        </Card>
      </main>
    </div>
  )
}
