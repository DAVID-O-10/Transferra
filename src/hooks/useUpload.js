import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code.slice(0, 3) + '-' + code.slice(3)
}

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function useUpload() {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [transfer, setTransfer] = useState(null)

  const uploadFile = async ({
    file,
    expiresInDays = 7,
    password = '',
    maxDownloads = null,
    recipientEmail = ''
  }) => {
    if (!user) throw new Error('Must be signed in')
    if (!file) throw new Error('No file selected')

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // 1. Generate unique transfer code
      const code = generateCode()

      // 2. Build storage path: {user_id}/{timestamp}-{random}-{filename}
      setProgress(5)
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${user.id}/${timestamp}-${random}-${safeFileName}`

      // 3. Upload file directly to Supabase Storage
      setProgress(10)
      const { error: uploadError } = await supabase.storage
        .from('transfers')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Failed to upload file to storage')
      }

      setProgress(60)

      // 4. Hash password if provided
      const passwordHash = password ? await hashPassword(password) : null

      // 5. Create transfer record in Supabase
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      setProgress(70)

      const { data: transferData, error: insertError } = await supabase
        .from('transfers')
        .insert({
          code,
          sender_id: user.id,
          sender_email: user.email,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          r2_key: storagePath,
          expires_at: expiresAt.toISOString(),
          max_downloads: maxDownloads || null,
          password_hash: passwordHash,
          recipient_email: recipientEmail || null,
          status: 'active',
          download_count: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(insertError.message)
      }

      setProgress(100)
      setTransfer(transferData)
      return transferData

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setTransfer(null)
    setError(null)
    setProgress(0)
  }

  return { uploadFile, uploading, progress, error, transfer, reset }
}