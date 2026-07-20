// Supabase Edge Function: download-file
// Generates a signed URL for downloading a file from Supabase Storage
//
// Environment variables needed (set via `supabase secrets set`):
//   None required — uses the service role key automatically available in Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transferCode, password } = await req.json()

    if (!transferCode) {
      throw new Error('Transfer code is required')
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Look up the transfer by code
    const { data: transfer, error: fetchError } = await supabase
      .from('transfers')
      .select('*')
      .eq('code', transferCode.toUpperCase())
      .single()

    if (fetchError || !transfer) {
      throw new Error('Transfer not found. Check the code and try again.')
    }

    // Check expiry
    if (new Date(transfer.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from('transfers')
        .update({ status: 'expired' })
        .eq('id', transfer.id)
      throw new Error('This transfer has expired.')
    }

    // Check if already deleted
    if (transfer.status === 'deleted') {
      throw new Error('This transfer has been deleted.')
    }

    // Check if already fully downloaded
    if (transfer.status === 'downloaded') {
      throw new Error('This file has already been downloaded and deleted.')
    }

    // Check max downloads
    if (transfer.max_downloads && transfer.download_count >= transfer.max_downloads) {
      throw new Error('Maximum download limit reached.')
    }

    // Verify password if required
    if (transfer.password_hash) {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password required', requiresPassword: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      // Hash the provided password and compare
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      if (passwordHash !== transfer.password_hash) {
        throw new Error('Incorrect password.')
      }
    }

    // Get the storage path from r2_key column
    const storagePath = transfer.r2_key
    if (!storagePath) {
      throw new Error('File not found in storage.')
    }

    // Generate a signed URL for download (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('transfers')
      .createSignedUrl(storagePath, 3600)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      throw new Error('Failed to generate download URL.')
    }

    // Update download count and status
    const newDownloadCount = (transfer.download_count || 0) + 1
    const newStatus = transfer.max_downloads && newDownloadCount >= transfer.max_downloads
      ? 'downloaded'
      : transfer.status === 'pending' ? 'active' : transfer.status

    await supabase
      .from('transfers')
      .update({
        download_count: newDownloadCount,
        last_downloaded_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', transfer.id)

    return new Response(
      JSON.stringify({
        presignedUrl: signedUrlData.signedUrl,
        filename: transfer.file_name,
        contentType: transfer.file_type,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})