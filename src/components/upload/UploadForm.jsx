import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUploadCloud, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi'

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
}

function UploadForm({ onSubmit, uploading, progress, error, transfer, onReset }) {
  const [file, setFile] = useState(null)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(7)
  const [password, setPassword] = useState('')
  const [maxDownloads, setMaxDownloads] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    setDragCounter(0)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => prev + 1)
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter((prev) => {
      const next = prev - 1
      if (next === 0) setDragOver(false)
      return next
    })
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) return

    onSubmit({
      file,
      recipientEmail,
      expiresInDays,
      password,
      maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : null,
    })
  }

  // Show success state after transfer
  if (transfer) {
    const shareUrl = `${window.location.origin}/download/${transfer.code}`

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111827] border border-[#1f2937] rounded-2xl p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
          >
            <FiCheck className="w-8 h-8 text-green-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">File Ready to Share</h3>
          <p className="text-gray-400 mb-6">
            Your file has been uploaded securely. Share the code or link with your recipient.
          </p>

          <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
            <div className="text-gray-400 text-sm mb-1">Transfer Code</div>
            <div className="text-2xl font-mono font-bold text-white tracking-widest">
              {transfer.code}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <div className="text-gray-400 text-sm mb-1">Shareable Link</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-900 text-gray-300 text-sm px-3 py-2 rounded-lg border border-gray-700"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Expires in {transfer.expires_at ? new Date(transfer.expires_at).toLocaleDateString() : '7 days'}
            {transfer.max_downloads && ` · Max ${transfer.max_downloads} download${transfer.max_downloads > 1 ? 's' : ''}`}
            {transfer.password_hash && ' · Password protected'}
          </div>

          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send Another File
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Animated File Drop Zone */}
      <motion.div
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          scale: dragOver ? 1.02 : 1,
          borderColor: dragOver ? '#22d3ee' : file ? '#22c55e' : '#374151',
        }}
        transition={{ duration: 0.2 }}
        className="relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer overflow-hidden group"
      >
        {/* Animated background glow on drag */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-cyan-500/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
              <FiFile className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">{file.name}</div>
              <div className="text-gray-400 text-sm mt-1">{formatFileSize(file.size)}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
              Remove file
            </button>
          </motion.div>
        ) : (
          <motion.div
            animate={{ y: dragOver ? -5 : 0 }}
            className="space-y-3"
          >
            <motion.div
              animate={{ scale: dragOver ? 1.1 : 1 }}
              className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <FiUploadCloud className="w-7 h-7 text-cyan-400" />
            </motion.div>
            <div>
              <div className="text-gray-300 font-medium">
                {dragOver ? 'Drop your file here' : 'Drop a file here or click to browse'}
              </div>
              <div className="text-gray-500 text-sm mt-1">Any file type, up to 10 GB</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Recipient Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Email (optional)
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty if you want anyone with the code to download</p>
      </div>

      {/* Expiration */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Expires After
        </label>
        <select
          value={expiresInDays}
          onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
        >
          <option value={1}>1 day</option>
          <option value={2}>2 days</option>
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password Protection (optional)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Set a password for extra security"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Max Downloads */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Maximum Downloads (optional)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={maxDownloads}
          onChange={(e) => setMaxDownloads(e.target.value)}
          placeholder="Unlimited"
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited downloads (until expiration)</p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm"
          >
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <motion.button
        type="submit"
        disabled={!file || uploading}
        whileHover={!file || uploading ? {} : { scale: 1.01 }}
        whileTap={!file || uploading ? {} : { scale: 0.98 }}
        className={`
          w-full py-3 rounded-xl font-medium text-sm transition-all duration-200
          ${!file || uploading
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
          }
        `}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Uploading... {Math.round(progress)}%</span>
          </div>
        ) : (
          'Upload & Generate Code'
        )}
      </motion.button>

      {/* Progress bar */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-gray-800 rounded-full h-1.5"
          >
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}

export default UploadForm
