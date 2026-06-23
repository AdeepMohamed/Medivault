const supabase = require('../config/supabase');
const { summarizeRecord, chatWithAssistant } = require('../services/aiService');
const { logAction } = require('../services/auditService');

// POST /api/ai/summarize/:recordId
const summarize = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const { data: record, error } = await supabase
      .from('records').select('*').eq('id', recordId).eq('owner_id', req.user.id).single();

    if (error || !record) return res.status(404).json({ error: 'Record not found.' });

    // Check if we have a cached summary
    const { data: cached } = await supabase
      .from('ai_summaries').select('*').eq('record_id', recordId).single();

    if (cached && !req.query.regenerate) {
      return res.json({ summary: cached, cached: true });
    }

    // For PDF/text files, we'll summarize based on metadata since we can't easily extract text
    // In production, you'd use pdf-parse on the downloaded file
    const contextText = `
Title: ${record.title}
Category: ${record.category}
Date: ${record.record_date || 'Not specified'}
Description: ${record.description || 'No description provided'}
File Name: ${record.file_name}
    `.trim();

    const aiResult = await summarizeRecord(contextText, record.title, record.category);

    const disclaimer = 'This summary is AI-generated and is not a substitute for professional medical advice. Always consult a qualified healthcare provider.';

    // Save or update summary
    const summaryData = {
      record_id: recordId,
      summary: aiResult.summary,
      key_findings: aiResult.keyFindings || [],
      abnormal_values: aiResult.abnormalValues || [],
      disclaimer,
      generated_at: new Date(),
    };

    let aiSummary;
    if (cached) {
      const { data } = await supabase.from('ai_summaries').update(summaryData).eq('record_id', recordId).select().single();
      aiSummary = data;
    } else {
      const { data } = await supabase.from('ai_summaries').insert(summaryData).select().single();
      aiSummary = data;
    }

    await logAction({
      userId: req.user.id, action: 'AI_SUMMARIZE',
      resourceId: recordId, resourceType: 'record', ipAddress: req.ip,
    });

    res.json({ summary: aiSummary, cached: false });
  } catch (err) { next(err); }
};

// GET /api/ai/summary/:recordId
const getSummary = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    // Verify ownership
    const { data: record } = await supabase
      .from('records').select('id').eq('id', recordId).eq('owner_id', req.user.id).single();
    if (!record) return res.status(404).json({ error: 'Record not found.' });

    const { data: summary } = await supabase
      .from('ai_summaries').select('*').eq('record_id', recordId).single();

    res.json({ summary: summary || null });
  } catch (err) { next(err); }
};

// POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message, history = [], recordId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let contextRecord = null;
    if (recordId) {
      const { data: record } = await supabase
        .from('records').select('title, category, description, record_date')
        .eq('id', recordId).eq('owner_id', req.user.id).single();

      if (record) {
        contextRecord = `Record: ${record.title} (${record.category}), Date: ${record.record_date}, Description: ${record.description}`;
      }
    }

    const result = await chatWithAssistant(message, history, contextRecord);

    await logAction({
      userId: req.user.id, action: 'AI_CHAT',
      details: { isEmergency: result.isEmergency }, ipAddress: req.ip,
    });

    res.json({ response: result.response, isEmergency: result.isEmergency });
  } catch (err) { next(err); }
};

module.exports = { summarize, getSummary, chat };
