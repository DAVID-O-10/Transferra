import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTransfers } from '../hooks/useTransfers'
import { FiFile, FiCopy, FiTrash2, FiCheck, FiClock, FiLink, FiAlertCircle, FiLoader } from 'react-icons/fi'

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getStatusBadge(status, expiresAt) {
  if (status === 'deleted') return { label: 'Deleted', color: 'text-gray-500 bg-gray-800' }
  if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) {
    return { label: 'Expired', color: 'text-red-400 bg-red-900/30' }
  }
  if (status === 'active') return { label: 'Active', color: 'text-green-400 bg-green-900/30' }
  return { label: status, color: 'text-gray-400 bg-gray-800' }
}

function Inbox() {
  const { user } = useAuth()
  const { transfers, loading, error, deleteTransfer, copyLink } = useTransfers(user?.id)
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/inbox', label: 'Inbox' },
  ]

  const handleCopyLink = async (code, id) => {
    const success = await copyLink(code)
    if (success) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer? The file will be removed.')) return
    setDeletingId(id)
    await deleteTransfer(id)
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <div className="flex-1 flex items-center justify-center">
          <FiLoader className="animate-spin text-gray-400 text-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FiAlertCircle className="text-red-400 text-4xl mx-auto mb-4" />
            <div className="text-red-300 mb-2">Error loading transfers</div>
            <div className="text-gray-500 text-sm">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 p-6 flex flex-col">
        <div className="text-xl font-bold tracking-tight mb-8">Transferra</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8 border-t border-gray-800">
          <div className="text-gray-400 text-sm mb-3 truncate">{user?.email}</div>
          <button
            onClick={() => {/* signOut handled in Dashboard */}}
            className="text-gray-500 text-sm hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <div className="text-gray-500 text-sm">
            {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-20">
            <FiLink className="text-gray-600 text-5xl mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No transfers yet</div>
            <div className="text-gray-600 text-sm">Files you send will appear here</div>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((t) => {
              const statusBadge = getStatusBadge(t.status, t.expires_at)
              return (
                <div
                  key={t.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4 hover:border-gray-700 transition-colors"
                >
                  {/* File icon */}
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <FiFile className="text-gray-400 text-lg" />
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium truncate">{t.file_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span>{formatFileSize(t.file_size)}</span>
                      <span>•</span>
                      <span>{t.download_count || 0} download{(t.download_count || 0) !== 1 ? 's' : ''}</span>
                      {t.max_downloads && (
                        <>
                          <span>•</span>
                          <span>Max {t.max_downloads}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="text-[10px]" />
                        {formatDate(t.created_at)}
                      </span>
                      {t.password_hash && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-500">Password protected</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleCopyLink(t.code, t.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          title="Copy download link"
                        >
                          {copiedId === t.id ? (
                            <FiCheck className="text-green-400" />
                          ) : (
                            <FiCopy />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
                          title="Delete transfer"
                        >
                          {deletingId === t.id ? (
                            <FiLoader className="animate-spin" />
                          ) : (
                            <FiTrash2 />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Inbox
