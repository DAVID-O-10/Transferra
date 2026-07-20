import { useState } from 'react'
import { supabase } from '../lib/supabase'

async function verifyPassword(password, hash) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const result = await crypto.subtle.digest('SHA-256', data)
  const computed = Array.from(new Uint8Array(result))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return computed === hash
}

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
        .select('id, code, file_name, file_size, file_type, expires_at, status, download_count, max_downloads, password_hash, sender_email, r2_key, created_at')
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError || !data) {
        throw new Error('Transfer not found. Check the code and try again.')
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This transfer has expired.')
      }

      if (data.status === 'deleted') {
        throw new Error('This transfer has been deleted.')
      }

      if (data.status === 'downloaded') {
        throw new Error('This file has already been downloaded and deleted.')
      }

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

  // Download the file (client-side via Supabase Storage signed URL)
  const downloadFile = async (code, password = '') => {
    setLoading(true)
    setError(null)

    try {
      // Re-fetch the transfer to get latest state
      const { data: transferData, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (fetchError || !transferData) {
        throw new Error('Transfer not found.')
      }

      // Check password if needed
      if (transferData.password_hash) {
        if (!password) {
          return { requiresPassword: true }
        }
        const valid = await verifyPassword(password, transferData.password_hash)
        if (!valid) {
          throw new Error('Incorrect password. Try again.')
        }
      }

      // Create signed URL from Supabase Storage
      const { data: urlData, error: urlError } = await supabase.storage
        .from('transfers')
        .createSignedUrl(transferData.r2_key, 60)

      if (urlError) {
        console.error('Signed URL error:', urlError)
        throw new Error('Could not generate download link. The file may have been removed.')
      }

      // Trigger browser download
      const a = document.createElement('a')
      a.href = urlData.signedUrl
      a.download = transferData.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Update download count
      const newCount = (transferData.download_count || 0) + 1
      const maxReached = transferData.max_downloads && newCount >= transferData.max_downloads

      await supabase
        .from('transfers')
        .update({
          download_count: newCount,
          last_downloaded_at: new Date().toISOString(),
          status: maxReached ? 'downloaded' : transferData.status,
        })
        .eq('id', transferData.id)

      setDownloaded(true)
      return { success: true }
    } catch (err) {
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
