import React from 'react'

function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 p-6">
        <div className="text-xl font-bold tracking-tight mb-8">Transferra</div>
        <nav className="flex flex-col gap-2">
          <a href="/dashboard" className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium">Dashboard</a>
          <a href="/dashboard/send" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 text-sm font-medium transition-colors">Send File</a>
          <a href="/dashboard/inbox" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 text-sm font-medium transition-colors">Inbox</a>
          <a href="/dashboard/history" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 text-sm font-medium transition-colors">History</a>
        </nav>
        <div className="mt-auto pt-8 border-t border-gray-800 mt-8">
          <button className="text-gray-500 text-sm hover:text-white transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {/* Phase 5: Sender view will go here */}
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
      </main>
    </div>
  )
}

export default Dashboard
