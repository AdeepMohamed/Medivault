const supabase = require('../config/supabase');
const { uploadFile, deleteFile, getSignedUrl } = require('../services/fileService');
const { logAction } = require('../services/auditService');
const { validationResult } = require('express-validator');

// GET /api/records
const getRecords = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20, archived = 'false' } = req.query;

    let query = supabase
      .from('records')
      .select('*', { count: 'exact' })
      .eq('owner_id', req.user.id)
      .eq('is_archived', archived === 'true')
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (category && category !== 'All') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + Number(limit) - 1);

    const { data: records, error, count } = await query;
    if (error) throw error;

    res.json({ records, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

// GET /api/records/timeline
const getTimeline = async (req, res, next) => {
  try {
    const { data: records, error } = await supabase
      .from('records')
      .select('id, title, category, record_date, file_type, created_at, description')
      .eq('owner_id', req.user.id)
      .eq('is_archived', false)
      .not('record_date', 'is', null)
      .order('record_date', { ascending: false });

    if (error) throw error;
    res.json({ records });
  } catch (err) { next(err); }
};

// GET /api/records/stats
const getStats = async (req, res, next) => {
  try {
    const { data: records, error } = await supabase
      .from('records')
      .select('category, created_at, file_size')
      .eq('owner_id', req.user.id)
      .eq('is_archived', false);

    if (error) throw error;

    const stats = {
      total: records.length,
      byCategory: {},
      totalSize: 0,
      recentUploads: 0,
    };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    records.forEach(r => {
      stats.byCategory[r.category] = (stats.byCategory[r.category] || 0) + 1;
      stats.totalSize += r.file_size || 0;
      if (new Date(r.created_at) > thirtyDaysAgo) stats.recentUploads++;
    });

    res.json({ stats });
  } catch (err) { next(err); }
};

// GET /api/records/:id
const getRecord = async (req, res, next) => {
  try {
    const { data: record, error } = await supabase
      .from('records')
      .select('*')
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .single();

    if (error || !record) return res.status(404).json({ error: 'Record not found.' });

    // Fetch version history
    const { data: versions } = await supabase
      .from('record_versions')
      .select('*')
      .eq('record_id', record.id)
      .order('version', { ascending: false });

    // Fetch AI summary if exists
    const { data: aiSummary } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('record_id', record.id)
      .single();

    await logAction({
      userId: req.user.id, action: 'VIEW_RECORD',
      resourceId: record.id, resourceType: 'record', ipAddress: req.ip,
    });

    res.json({ record, versions: versions || [], aiSummary });
  } catch (err) { next(err); }
};

// POST /api/records
const createRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, category, description, record_date, tags } = req.body;

    if (!req.file) return res.status(400).json({ error: 'File is required.' });

    const { fileUrl, filePath } = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user.id,
    );

    const { data: record, error } = await supabase.from('records').insert({
      owner_id: req.user.id,
      title,
      category: category || 'Other',
      description,
      record_date: record_date || null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      file_url: fileUrl,
      file_path: filePath,
      file_type: req.file.mimetype,
      file_name: req.file.originalname,
      file_size: req.file.size,
      version: 1,
    }).select().single();

    if (error) throw error;

    await logAction({
      userId: req.user.id, action: 'UPLOAD_RECORD',
      resourceId: record.id, resourceType: 'record',
      details: { title, category, fileName: req.file.originalname },
      ipAddress: req.ip,
    });

    res.status(201).json({ record });
  } catch (err) { next(err); }
};

// PATCH /api/records/:id
const updateRecord = async (req, res, next) => {
  try {
    const { title, category, description, record_date, tags, expires_at } = req.body;

    const { data: existing } = await supabase
      .from('records').select('id, owner_id').eq('id', req.params.id).single();
    if (!existing || existing.owner_id !== req.user.id) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const { data: record, error } = await supabase
      .from('records')
      .update({ title, category, description, record_date, tags, expires_at, updated_at: new Date() })
      .eq('id', req.params.id)
      .select().single();

    if (error) throw error;

    await logAction({
      userId: req.user.id, action: 'UPDATE_RECORD',
      resourceId: record.id, resourceType: 'record', ipAddress: req.ip,
    });

    res.json({ record });
  } catch (err) { next(err); }
};

// POST /api/records/:id/version (upload new version)
const uploadNewVersion = async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('records').select('*').eq('id', req.params.id).eq('owner_id', req.user.id).single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Record not found.' });
    if (!req.file) return res.status(400).json({ error: 'File is required.' });

    // Save current version to history
    await supabase.from('record_versions').insert({
      record_id: existing.id,
      version: existing.version,
      file_url: existing.file_url,
      file_path: existing.file_path,
      file_name: existing.file_name,
      file_size: existing.file_size,
    });

    // Upload new version
    const { fileUrl, filePath } = await uploadFile(
      req.file.buffer, req.file.originalname, req.file.mimetype, req.user.id,
    );

    const { data: record, error } = await supabase
      .from('records')
      .update({
        file_url: fileUrl,
        file_path: filePath,
        file_type: req.file.mimetype,
        file_name: req.file.originalname,
        file_size: req.file.size,
        version: existing.version + 1,
        updated_at: new Date(),
      })
      .eq('id', req.params.id)
      .select().single();

    if (error) throw error;

    await logAction({
      userId: req.user.id, action: 'VERSION_RECORD',
      resourceId: existing.id, resourceType: 'record',
      details: { newVersion: existing.version + 1 }, ipAddress: req.ip,
    });

    res.json({ record });
  } catch (err) { next(err); }
};

// DELETE /api/records/:id
const deleteRecord = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records').select('*').eq('id', req.params.id).eq('owner_id', req.user.id).single();

    if (!record) return res.status(404).json({ error: 'Record not found.' });

    const { permanent } = req.query;

    if (permanent === 'true') {
      // Delete from storage
      if (record.file_path) await deleteFile(record.file_path);

      // Delete all version files
      const { data: versions } = await supabase
        .from('record_versions').select('file_path').eq('record_id', record.id);
      if (versions) {
        for (const v of versions) { if (v.file_path) await deleteFile(v.file_path); }
      }

      await supabase.from('records').delete().eq('id', record.id);
    } else {
      // Soft delete (archive)
      await supabase.from('records').update({ is_archived: true }).eq('id', record.id);
    }

    await logAction({
      userId: req.user.id, action: permanent === 'true' ? 'DELETE_RECORD' : 'ARCHIVE_RECORD',
      resourceId: record.id, resourceType: 'record', ipAddress: req.ip,
    });

    res.json({ message: permanent === 'true' ? 'Record permanently deleted.' : 'Record archived.' });
  } catch (err) { next(err); }
};

// GET /api/records/:id/download
const downloadRecord = async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from('records').select('*').eq('id', req.params.id).eq('owner_id', req.user.id).single();

    if (!record) return res.status(404).json({ error: 'Record not found.' });

    const signedUrl = await getSignedUrl(record.file_path, 300); // 5 min expiry

    await logAction({
      userId: req.user.id, action: 'DOWNLOAD_RECORD',
      resourceId: record.id, resourceType: 'record', ipAddress: req.ip,
    });

    res.json({ downloadUrl: signedUrl, fileName: record.file_name });
  } catch (err) { next(err); }
};

module.exports = { getRecords, getTimeline, getStats, getRecord, createRecord, updateRecord, uploadNewVersion, deleteRecord, downloadRecord };
