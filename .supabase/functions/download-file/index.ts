// Supabase Edge Function: download-file
// Generates a presigned GET URL for downloading a file from R2.
// Auth is OPTIONAL — public users can download with just the transfer code.
// Verifies password, checks download limits, and auto-deletes when limit reached.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple SHA-256 hash for password verification (matches the one used during upload)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse request body first (no auth required)
    const { transferCode, password } = await req.json();

    if (!transferCode) {
      return new Response(
        JSON.stringify({ error: "Missing transferCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create service-role client for DB reads (no auth needed for public access)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Optionally detect authenticated user for notification messages
    let downloaderEmail = "Someone";
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const authClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await authClient.auth.getUser();
        if (user?.email) downloaderEmail = user.email;
      } catch {
        // Not authenticated — that's fine, proceed as public
      }
    }

    // 4. Look up the transfer record
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .select("*")
      .eq("code", transferCode.toUpperCase())
      .single();

    if (transferError || !transfer) {
      return new Response(
        JSON.stringify({ error: "Transfer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check if expired
    if (new Date(transfer.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This transfer has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Check if already downloaded beyond limit
    if (transfer.status === "downloaded" || transfer.status === "deleted") {
      return new Response(
        JSON.stringify({ error: "This file has already been downloaded and deleted" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Check max downloads
    if (transfer.max_downloads && transfer.download_count >= transfer.max_downloads) {
      return new Response(
        JSON.stringify({ error: "Maximum download limit reached" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Verify password if set
    if (transfer.password_hash) {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "Password required", requiresPassword: true }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const providedHash = await hashPassword(password);
      if (providedHash !== transfer.password_hash) {
        return new Response(
          JSON.stringify({ error: "Incorrect password" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 9. Create R2 client and presigned GET URL (valid for 5 minutes)
    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: R2_SECRET_ACCESS_KEY ?? "",
      },
    });

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: transfer.storage_path,
      ResponseContentDisposition: `attachment; filename="${transfer.original_filename}"`,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 5 * 60, // 5 minutes
    });

    // 10. Update download count
    const newCount = (transfer.download_count || 0) + 1;
    const maxReached = transfer.max_downloads && newCount >= transfer.max_downloads;

    await supabase
      .from("transfers")
      .update({
        download_count: newCount,
        status: maxReached ? "downloaded" : transfer.status,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", transfer.id);

    // 11. If limit reached, delete from R2 (after presigned URL is generated)
    if (maxReached) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: transfer.storage_path,
          })
        );
        await supabase
          .from("transfers")
          .update({ status: "deleted" })
          .eq("id", transfer.id);
      } catch (deleteError) {
        console.error("Failed to delete from R2:", deleteError);
      }
    }

    // 12. Notify the sender (insert a notification row)
    if (transfer.sender_id) {
      await supabase.from("notifications").insert({
        user_id: transfer.sender_id,
        type: "download",
        transfer_id: transfer.id,
        message: `Your file "${transfer.original_filename}" was downloaded by ${downloaderEmail}`,
      });
    }

    return new Response(
      JSON.stringify({
        presignedUrl,
        filename: transfer.original_filename,
        fileSize: transfer.file_size,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("download-file error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
