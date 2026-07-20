import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [transfer, setTransfer] = useState(null)
  const [downloaded, setDownloaded] = useState(false)

  // Look up a transfer by code (public — no auth needed)
  const lookupTransfer = async (code) => {
    setLoading(true)
    setError(null)
    setTransfer(null)
    setDownloaded(false)

    try {
      const { data, error: fetchError } = await supabase
        .from('transfers')
        .select('id, code, file_name, file_size, file_type, expires_at, status, download_count, max_downloads, password_hash, sender_email, created_at')
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError || !data) {
        throw new Error('Transfer not found. Check the code and try again.')
      }

      // Check expiry
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This transfer has expired.')
      }

      // Check if already deleted
      if (data.status === 'deleted') {
        throw new Error('This transfer has been deleted.')
      }

      // Check if already fully downloaded
      if (data.status === 'downloaded') {
        throw new Error('This file has already been downloaded and deleted.')
      }

      // Check max downloads
      if (data.max_downloads && data.download_count >= data.max_downloads) {
        throw new Error('Maximum download limit reached.')
      }

      setTransfer(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Download the file (calls Edge Function)
  const downloadFile = async (code, password = '') => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('download-file', {
        body: {
          transferCode: code.toUpperCase(),
          password: password || undefined,
        }
      })

      if (fnError) {
        // Parse the error message from the Edge Function
        const msg = data?.error || fnError.message || 'Download failed'
        if (data?.requiresPassword) {
          throw new Error('PASSWORD_REQUIRED')
        }
        throw new Error(msg)
      }

      // Check if password is required
      if (data?.requiresPassword) {
        return { requiresPassword: true }
      }

      // Trigger browser download via presigned URL
      const a = document.createElement('a')
      a.href = data.presignedUrl
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setDownloaded(true)
      return data
    } catch (err) {
      if (err.message === 'PASSWORD_REQUIRED') {
        setError(null) // Don't show error — show password UI instead
        return { requiresPassword: true }
      }
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setTransfer(null)
    setError(null)
    setDownloaded(false)
  }

  return { transfer, loading, error, downloaded, lookupTransfer, downloadFile, reset }
}