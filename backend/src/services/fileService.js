const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const BUCKET = 'medical-records';

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type
 * @param {string} userId - Owner user ID
 * @returns {{ fileUrl, filePath }}
 */
const uploadFile = async (buffer, originalName, mimeType, userId) => {
  const ext = path.extname(originalName);
  const uniqueName = `${uuidv4()}${ext}`;
  const filePath = `${userId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    fileUrl: urlData.publicUrl,
    filePath,
  };
};

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - Storage path to delete
 */
const deleteFile = async (filePath) => {
  if (!filePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) console.error('[FILE] Delete error:', error.message);
};

/**
 * Generate a signed (temporary) URL for secure download
 * @param {string} filePath
 * @param {number} expiresInSeconds
 */
const getSignedUrl = async (filePath, expiresInSeconds = 3600) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw new Error(`Failed to generate signed URL: ${error.message}`);
  return data.signedUrl;
};

module.exports = { uploadFile, deleteFile, getSignedUrl };
