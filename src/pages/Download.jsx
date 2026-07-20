import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDownload } from '../hooks/useDownload'

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

function formatExpiry(dateStr) {
  const now = new Date()
  const exp = new Date(dateStr)
  const diffMs = exp - now
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} remaining`
  }
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}

function getFileIcon(filename) {
  if (!filename) return '📄'
  const ext = filename.split('.').pop()?.toLowerCase()
  const iconMap = {
    pdf: '📕', doc: '📘', docx: '📘', txt: '📝',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
    mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
    mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵',
    zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
    js: '📜', ts: '📜', py: '📜', java: '📜',
    xls: '📊', xlsx: '📊', csv: '📊',
    ppt: '📊', pptx: '📊',
  }
  return iconMap[ext] || '📄'
}

export default function Download() {
  const { code: urlCode } = useParams()
  const { transfer, loading, error, downloaded, lookupTransfer, downloadFile, reset } = useDownload()

  const [code, setCode] = useState(urlCode || '')
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [step, setStep] = useState(urlCode ? 'lookup' : 'input') // input | lookup | confirm | success | error

  // Auto-lookup when code comes from URL
  useEffect(() => {
    if (urlCode) {
      setCode(urlCode)
      setStep('lookup')
      lookupTransfer(urlCode).then((result) => {
        if (result) {
          if (result.password_hash) {
            setNeedsPassword(true)
            setStep('confirm')
          } else {
            setStep('confirm')
          }
        } else {
          setStep('error')
        }
      })
    }
  }, [urlCode])

  const handleLookup = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) return

    setStep('lookup')
    setNeedsPassword(false)
    setPassword('')

    const result = await lookupTransfer(cleanCode)
    if (result) {
      if (result.password_hash) {
        setNeedsPassword(true)
      }
      setStep('confirm')
    } else {
      setStep('error')
    }
  }

  const handleDownload = async () => {
    const result = await downloadFile(code, password)
    if (result?.requiresPassword) {
      setNeedsPassword(true)
      return
    }
    if (result) {
      setStep('success')
    }
  }

  const handleTryAgain = () => {
    reset()
    setCode('')
    setPassword('')
    setNeedsPassword(false)
    setStep('input')
  }

  // ─── Step: Code Input ────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md px-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-2">Receive a file</h2>
            <p className="text-gray-400 text-sm mb-6">Enter the transfer code you received</p>

            <form onSubmit={handleLookup}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ABC-123"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors mb-4"
                autoFocus
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Lookup Transfer
              </button>
            </form>
          </div>

          <p className="text-gray-500 text-xs mt-6">Files are encrypted and deleted after download</p>
        </div>
      </div>
    )
  }

  // ─── Step: Looking up ────────────────────────────────────────────
  if (step === 'lookup') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md px-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="animate-pulse">
              <div className="w-12 h-12 border-2 border-gray-700 border-t-white rounded-full mx-auto mb-4 animate-spin" />
              <p className="text-gray-400 text-sm">Looking up transfer...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Error ─────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md px-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-red-950/50 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">✕</span>
            </div>
            <h2 className="text-lg font-bold mb-2">Transfer not found</h2>
            <p className="text-gray-400 text-sm mb-6">{error || 'Check the code and try again.'}</p>
            <button
              onClick={handleTryAgain}
              className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Confirm Download (transfer info + password gate) ──────
  if (step === 'confirm' && transfer) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md px-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            {/* File icon */}
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{getFileIcon(transfer.file_name)}</span>
            </div>

            {/* File name */}
            <h2 className="text-lg font-bold mb-1 truncate">{transfer.file_name}</h2>

            {/* Meta info */}
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mb-6">
              <span>{formatFileSize(transfer.file_size)}</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <span>{formatExpiry(transfer.expires_at)}</span>
            </div>

            {/* Sender info */}
            {transfer.sender_email && (
              <p className="text-gray-500 text-xs mb-4">
                Sent by <span className="text-gray-400">{transfer.sender_email}</span>
              </p>
            )}

            {/* Password gate */}
            {needsPassword && (
              <div className="mb-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-gray-300 text-sm mb-3">This file is password protected</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-xs mt-2">{error}</p>
                )}
              </div>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={loading || (needsPassword && !password)}
              className="w-full bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  Download File
                </>
              )}
            </button>

            {/* One-time notice */}
            {!transfer.max_downloads && (
              <p className="text-gray-500 text-xs mt-3">One-time download — file will be deleted after</p>
            )}
            {transfer.max_downloads && transfer.max_downloads > 1 && (
              <p className="text-gray-500 text-xs mt-3">
                {transfer.max_downloads - (transfer.download_count || 0)} of {transfer.max_downloads} downloads remaining
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Success ───────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md px-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-8">Transferra</div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-green-950/50 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-bold mb-2">Download started</h2>
            <p className="text-gray-400 text-sm mb-6">
              {transfer?.file_name || 'Your file'} is downloading now.
            </p>
            <button
              onClick={handleTryAgain}
              className="w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Download Another File
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
