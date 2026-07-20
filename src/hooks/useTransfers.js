import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTransfers(userId) {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransfers = async () => {
    if (!userId) {
      setTransfers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('transfers')
        .select('id, code, file_name, file_size, file_type, status, download_count, max_downloads, password_hash, created_at, expires_at, sender_email')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTransfers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [userId])

  // Delete a transfer (set status to deleted)
  const deleteTransfer = async (transferId) => {
    try {
      const { error: deleteError } = await supabase
        .from('transfers')
        .update({ status: 'deleted' })
        .eq('id', transferId)

      if (deleteError) throw deleteError

      // Update local state
      setTransfers(prev =>
        prev.map(t => t.id === transferId ? { ...t, status: 'deleted' } : t)
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // Copy transfer link to clipboard
  const copyLink = async (code) => {
    const url = `${window.location.origin}/download/${code}`
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  }

  return { transfers, loading, error, deleteTransfer, copyLink, refetch: fetchTransfers }
}