// Supabase Edge Function: upload-file
// Generates a presigned PUT URL for uploading directly to Cloudflare R2.
// The client uploads the file directly to R2 using this URL.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3";
import { createHmac } from "https://deno.land/std@0.177.0/hash/sha256.ts";

// R2 credentials from environment
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL"); // Optional: custom domain or public bucket URL

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const { filename, fileSize, contentType, transferCode } = await req.json();

    if (!filename || !fileSize || !transferCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: filename, fileSize, transferCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (max 10GB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 10GB limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Generate a unique storage path
    //    Format: transfers/{transferCode}/{uuid}-{filename}
    const uuid = crypto.randomUUID();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `transfers/${transferCode}/${uuid}-${safeFilename}`;

    // 4. Create R2 client and presigned URL
    const r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: R2_SECRET_ACCESS_KEY ?? "",
      },
    });

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      ContentType: contentType || "application/octet-stream",
      ContentLength: fileSize,
      Metadata: {
        "upload-user-id": user.id,
        "transfer-code": transferCode,
        "original-filename": filename,
      },
    });

    // Presigned URL valid for 15 minutes
    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 15 * 60,
    });

    return new Response(
      JSON.stringify({
        presignedUrl,
        storagePath,
        publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${storagePath}` : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("upload-file error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
