import React from 'react'

function Download() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md px-8 text-center">
        <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>
        
        {/* Phase 9: Claim flow (code input + retention selection) will go here */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-2">Receive a file</h2>
          <p className="text-gray-400 text-sm mb-6">Enter the transfer code you received</p>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="ABC-123" 
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-white transition-colors"
            />
          </div>
          
          <button className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Claim File
          </button>
        </div>
      </div>
    </div>
  )
}

export default Download
