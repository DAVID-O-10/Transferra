import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUpload } from '../hooks/useUpload'
import UploadForm from '../components/upload/UploadForm'
import NotificationBell from '../components/ui/NotificationBell'

function Dashboard() {
  const { user, signOut } = useAuth()
  const { uploadFile, uploading, progress, error, transfer, reset } = useUpload()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/dashboard/inbox', label: 'Inbox' },
  ]

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
            onClick={signOut}
            className="text-gray-500 text-sm hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Files Sent</div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Files Received</div>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Active Transfers</div>
            <div className="text-3xl font-bold">0</div>
          </div>
        </div>

        {/* Upload section */}
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Send a File</h2>
          <UploadForm
            onSubmit={uploadFile}
            uploading={uploading}
            progress={progress}
            error={error}
            transfer={transfer}
            onReset={reset}
          />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
