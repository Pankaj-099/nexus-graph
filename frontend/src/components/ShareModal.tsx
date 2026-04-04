import { useState } from 'react'
import { Copy, Check, Globe, Lock, ExternalLink } from 'lucide-react'
import type { Project } from '../types/graph'
import { projectsApi } from '../api/projects'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import toast from 'react-hot-toast'

interface ShareModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onUpdate: (project: Project) => void
}

export const ShareModal = ({ project, isOpen, onClose, onUpdate }: ShareModalProps) => {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = project.share_token
    ? `${window.location.origin}/shared/${project.share_token}`
    : null

  const handleToggle = async () => {
    setLoading(true)
    try {
      const updated = await projectsApi.toggleShare(project.id)
      onUpdate(updated)
      if (updated.is_public) {
        toast.success('Graph is now public!')
      } else {
        toast.success('Graph is now private')
      }
    } catch {
      toast.error('Failed to update sharing')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Graph">
      <div className="space-y-5">
        {/* Status */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          project.is_public
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-slate-800/50 border-slate-700'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            project.is_public ? 'bg-emerald-500/20' : 'bg-slate-700'
          }`}>
            {project.is_public
              ? <Globe size={18} className="text-emerald-400" />
              : <Lock size={18} className="text-slate-400" />
            }
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {project.is_public ? 'Public Graph' : 'Private Graph'}
            </p>
            <p className="text-xs text-slate-400">
              {project.is_public
                ? 'Anyone with the link can view this graph'
                : 'Only you can access this graph'}
            </p>
          </div>
          <Button
            size="sm"
            variant={project.is_public ? 'danger' : 'primary'}
            onClick={handleToggle}
            isLoading={loading}
          >
            {project.is_public ? 'Make Private' : 'Make Public'}
          </Button>
        </div>

        {/* Share link */}
        {project.is_public && shareUrl && (
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate">
                {shareUrl}
              </div>
              <Button size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </Button>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Embed code */}
        {project.is_public && shareUrl && (
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Embed Code</label>
            <pre className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
{`<iframe
  src="${shareUrl}"
  width="100%"
  height="600"
  frameborder="0"
/>`}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  )
}
