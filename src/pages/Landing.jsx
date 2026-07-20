import React from 'react'

function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Landing page will be built in Phase 4 + Phase 13 (3D) */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-bold tracking-tight">Transferra</div>
        <div className="flex items-center gap-4">
          <a href="/auth" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</a>
          <a href="/auth" className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Get Started</a>
        </div>
      </nav>
      <main className="flex flex-col items-center justify-center px-8 pt-32 pb-20 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-6">
          Send files.<br />
          <span className="text-gray-500">They disappear.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-xl mb-10">
          Transferra is a secure file transfer portal. Send any file to anyone — no storage, no syncing, no trace. Files exist just long enough to be received, then they're gone.
        </p>
        <div className="flex gap-4">
          <a href="/auth" className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Start Sending
          </a>
          <a href="#how-it-works" className="border border-gray-700 px-8 py-3 rounded-lg font-medium hover:border-gray-500 transition-colors">
            How It Works
          </a>
        </div>
      </main>
    </div>
  )
}

export default Landing
