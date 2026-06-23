const supabase = require('../config/supabase');

// GET /api/audit
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const from = (page - 1) * limit;

    const { data: logs, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(from, from + Number(limit) - 1);

    if (error) throw error;
    res.json({ logs, total: count, page: Number(page) });
  } catch (err) { next(err); }
};

module.exports = { getAuditLogs };
