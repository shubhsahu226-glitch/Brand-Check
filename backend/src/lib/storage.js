const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const BUCKET_NAME = 'brand-documents';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

/**
 * Ensures bucket exists (creates if missing and credentials permit)
 */
async function ensureBucket() {
  if (!supabase) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
    }
  } catch (_e) {
    // Ignore bucket list/create permission errors
  }
}

/**
 * Uploads a document buffer to Supabase Storage
 */
async function uploadDocument(storagePath, buffer, mimeType) {
  if (!supabase) {
    return { path: storagePath, fallback: true };
  }

  try {
    await ensureBucket();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
    }
    return { path: storagePath };
  } catch (err) {
    console.warn('Storage upload error, proceeding with metadata:', err.message);
    return { path: storagePath, fallback: true };
  }
}

/**
 * Generates a signed download URL valid for 60 seconds
 */
async function getSignedUrl(storagePath, expiresIn = 60) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error) return null;
    return data?.signedUrl || null;
  } catch (_e) {
    return null;
  }
}

/**
 * Deletes a file from Supabase Storage
 */
async function deleteDocument(storagePath) {
  if (!supabase) return;
  try {
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
  } catch (err) {
    console.warn('Storage deletion error:', err.message);
  }
}

module.exports = {
  uploadDocument,
  getSignedUrl,
  deleteDocument,
  BUCKET_NAME,
};
